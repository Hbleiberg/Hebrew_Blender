/*
 * ivrit-projects.js — cloud copies of Hebrew Font Maker projects (window.IvritProjects).
 *
 * The fourth and last file that talks to Supabase (with supabase-config.js, ivrit-account.js and
 * ivrit-saves.js). Loaded only by Hebrew_Font_Maker.html, after the other three:
 *   <script src="/js/ivrit-projects.js" defer></script>
 *
 * What it owns: the `font_projects` catalogue rows and the three private buckets — the gzipped project
 * file in `font-projects`, one object per distinct photo in `font-sources` (content-addressed, so an
 * unchanged photo is never uploaded twice), the latest exported font in `font-exports`. Every object lives
 * under `<user id>/<project id>/`, which is what the Storage policies allow.
 *
 * What it never does: touch the page's `project`, read or write localStorage/IndexedDB, or build UI. The
 * page packs a project into {json, sources} and unpacks it back (it knows the project format); this
 * module moves bytes and rows, checks sizes before a byte moves, and reports every failure as a rejected
 * promise carrying `err.code` (mapped to words by IvritSaves.errorText).
 *
 * Safety rules the design leans on:
 *   - A new project's row is inserted BEFORE any upload, so the 25-project cap and a taken name are
 *     refused before a byte moves; a row whose uploads then fail is removed again.
 *   - The project file is uploaded under a versioned name and the row is switched to it with a conditional
 *     update (`updated_at` must still be what the caller last saw). If another device wrote first the
 *     update matches nothing, the caller gets `changed`, and the other device's file was never touched.
 *   - Photos are content-addressed: `<hash>.<ext>`. Missing ones are uploaded, present ones skipped,
 *     unreferenced ones removed after a successful save (best effort).
 *
 * API (every function returns a promise; signed out → rejects with code 'signed_out'):
 *   list({fresh})              rows, newest first (memoised 30 s per user; every write invalidates)
 *   get(id)                    one row or null (never memoised — the conflict probe)
 *   save({id?, name, meta, projectGz, sources, expectedUpdatedAt?, onProgress?})  → the saved row
 *                              meta: {family_name, style, schema_version, letters_done, client_saved_at}
 *                              sources: [{name, size, blob?, label?}] — blob may be omitted for a photo
 *                              the folder already holds; onProgress({phase:'sources', done, total} | {phase:'project'})
 *   open(id)                   {row, gz: ArrayBuffer}
 *   downloadSource(id, name)   Blob
 *   listSources(id)            [{name, size}]
 *   remove(id)                 true — every object in the three buckets, then the row
 *   saveExport(id, blob, name) the row (one export slot: older exports in the folder are removed)
 *   downloadExport(id)         {blob, name}
 *   count()                    {n, bytes}
 *   onChange(fn)               fn() after every write
 *   limits                     {gz, source, export, projects}
 *
 * Error codes: 'signed_out', 'disabled'/'offline'/'blocked' (from IvritAccount), 'name', 'shape',
 * 'project_too_big', 'file_too_big' (+ err.label), 'source_missing' (+ err.names), 'changed',
 * 'not_found', 'bad_type', 'project_limit', and the Postgres codes ('23505' name taken, '42501').
 */
(function () {
  'use strict';

  var BUCKETS = { project: 'font-projects', sources: 'font-sources', exports: 'font-exports' };
  var MAX_GZ = 20 * 1024 * 1024;        // font-projects bucket cap
  var MAX_SOURCE = 15 * 1024 * 1024;    // font-sources bucket cap (migration 0002)
  var MAX_EXPORT = 5 * 1024 * 1024;     // font-exports bucket cap
  var MAX_PROJECTS = 25;                // the table's trigger cap
  var LIST_TTL = 30000;
  var CONC = 3;                         // parallel uploads / downloads
  var PAGE = 100;                       // Storage list page size
  var SOURCE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/;
  var ROW_COLS = 'id, name, family_name, style, schema_version, letters_done, has_images, project_path, project_bytes, sources_bytes, export_path, exported_at, client_saved_at, created_at, updated_at';

  var cache = { uid: null, at: 0, rows: null, promise: null };
  var listeners = [];

  /* ---------- helpers ---------- */
  function A() { return window.IvritAccount || null; }
  function warn() { try { console.warn.apply(console, arguments); } catch (e) {} }
  function makeError(code, msg) { var e = new Error(msg || ('IvritProjects: ' + code)); e.code = code; return e; }
  function currentUser() { var a = A(); return (a && typeof a.user === 'function') ? a.user() : null; }
  function ensureUser() { var u = currentUser(); if (!u) throw makeError('signed_out'); return u; }
  function client() {
    var a = A();
    if (!a || typeof a.client !== 'function') return Promise.reject(makeError('disabled', 'IvritProjects: IvritAccount is not loaded'));
    return a.client();
  }
  function isAuthError(err) {
    var st = Number((err && (err.status || err.statusCode)) || 0);
    return String((err && err.code) || '') === 'PGRST301' || st === 401 || /jwt/i.test(String((err && err.message) || ''));
  }
  // Storage and PostgREST failures come back as {data, error}; give every error one of our codes where
  // its shape is known, and keep the rest as they are (IvritSaves.errorText knows the Postgres ones).
  function normalise(err) {
    if (!err) return makeError('generic');
    var out = (err instanceof Error) ? err : makeError(String(err.code || 'generic'), err.message);
    if (!(err instanceof Error)) { out.status = err.status; out.statusCode = err.statusCode; }
    var st = Number(out.status || out.statusCode || 0);
    var msg = String(out.message || '').toLowerCase();
    var code = String(out.code || '');
    if (st === 413 || /payload too large|maximum allowed size|exceeded the maximum/.test(msg)) out.code = 'file_too_big';
    else if (st === 415 || /mime type|invalid mime|not supported/.test(msg)) out.code = 'bad_type';
    else if (st === 404 || /object not found|not_found/.test(msg)) out.code = 'not_found';
    else if (code === '23514' && /project limit/.test(msg)) out.code = 'project_limit';
    return out;
  }
  function unwrap(res) {
    if (res && res.error) throw normalise(res.error);
    return res ? res.data : null;
  }
  // One retry after the SDK refreshes a stale token; every other failure surfaces as is.
  function withClient(fn) {
    return client().then(function (c) {
      return Promise.resolve().then(function () { return fn(c); }).then(unwrap).catch(function (err) {
        if (!isAuthError(err)) throw err;
        return c.auth.getSession().then(function () { return Promise.resolve().then(function () { return fn(c); }).then(unwrap); });
      });
    });
  }
  // Runs fn over items with at most n in flight; rejects on the first failure (after the in-flight ones settle).
  function pool(items, n, fn) {
    var i = 0, failed = null;
    function next() {
      if (failed) return Promise.resolve();
      if (i >= items.length) return Promise.resolve();
      var it = items[i++];
      return Promise.resolve().then(function () { return fn(it); }).then(next, function (err) { failed = failed || err; });
    }
    var lanes = [];
    for (var k = 0; k < Math.max(1, n); k++) lanes.push(next());
    return Promise.all(lanes).then(function () { if (failed) throw failed; });
  }
  function invalidate() { cache.rows = null; cache.at = 0; cache.promise = null; }
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) { warn('IvritProjects listener failed:', e); } }); }
  function safeMeta(meta) {
    meta = meta || {};
    var out = {};
    if (meta.family_name !== undefined) out.family_name = meta.family_name === null ? null : String(meta.family_name).slice(0, 120);
    if (meta.style !== undefined) out.style = meta.style === null ? null : String(meta.style).slice(0, 60);
    if (meta.schema_version !== undefined) out.schema_version = Number.isFinite(Number(meta.schema_version)) ? Math.round(Number(meta.schema_version)) : null;
    if (meta.letters_done !== undefined) out.letters_done = Math.max(0, Math.round(Number(meta.letters_done) || 0));
    if (meta.client_saved_at !== undefined) out.client_saved_at = meta.client_saved_at || null;
    return out;
  }
  function folderOf(uid, id) { return uid + '/' + id; }
  function baseName(path) { var s = String(path || ''); return s.slice(s.lastIndexOf('/') + 1); }
  function fileStem(name) { return String(name || 'font').replace(/[^\w.-]+/g, '_').replace(/^[_.]+/, '').slice(0, 100) || 'font'; }
  function isUuid(id) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || '')); }

  /* ---------- storage primitives ---------- */
  // Every file under a folder (files only: the listing also returns virtual sub-folders with id null).
  function listAll(bucket, folder) {
    var all = [];
    function page(offset) {
      return withClient(function (c) { return c.storage.from(bucket).list(folder, { limit: PAGE, offset: offset, sortBy: { column: 'name', order: 'asc' } }); })
        .then(function (rows) {
          rows = (rows || []).filter(function (r) { return r && r.name && r.id; });
          all = all.concat(rows.map(function (r) { return { name: r.name, size: Number((r.metadata && r.metadata.size) || 0), updated_at: r.updated_at || null }; }));
          return rows.length === PAGE ? page(offset + PAGE) : all;
        });
    }
    return page(0);
  }
  function uploadObject(bucket, path, blob, contentType) {
    return withClient(function (c) { return c.storage.from(bucket).upload(path, blob, { upsert: true, contentType: contentType || blob.type || 'application/octet-stream', cacheControl: '3600' }); });
  }
  function downloadObject(bucket, path) {
    return withClient(function (c) { return c.storage.from(bucket).download(path); }).then(function (blob) {
      if (!blob) throw makeError('not_found');
      return blob;
    });
  }
  function removeObjects(bucket, paths) {
    if (!paths || !paths.length) return Promise.resolve([]);
    return withClient(function (c) { return c.storage.from(bucket).remove(paths); });
  }
  function removeFolder(bucket, folder) {
    return listAll(bucket, folder).then(function (objs) { return removeObjects(bucket, objs.map(function (o) { return folder + '/' + o.name; })); });
  }

  /* ---------- rows ---------- */
  function list(opts) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      var fresh = !!(opts && opts.fresh);
      if (!fresh && cache.uid === u.id && cache.rows && Date.now() - cache.at < LIST_TTL) return cache.rows.slice();
      if (cache.uid === u.id && cache.promise) return cache.promise;
      var p = withClient(function (c) { return c.from('font_projects').select(ROW_COLS).order('updated_at', { ascending: false }); })
        .then(function (rows) {
          rows = rows || [];
          if (cache.promise === p) cache = { uid: u.id, at: Date.now(), rows: rows, promise: null };
          return rows.slice();
        }, function (err) { if (cache.promise === p) cache.promise = null; throw err; });
      cache.uid = u.id; cache.promise = p;
      return p;
    });
  }
  function get(id) {
    return Promise.resolve().then(function () {
      ensureUser();
      if (!isUuid(id)) throw makeError('not_found');
      return withClient(function (c) { return c.from('font_projects').select(ROW_COLS).eq('id', id).maybeSingle(); });
    });
  }
  function deleteRow(id) { return withClient(function (c) { return c.from('font_projects').delete().eq('id', id).select('id'); }); }

  /* ---------- save ---------- */
  function save(opts) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      opts = opts || {};
      var name = String(opts.name === undefined || opts.name === null ? '' : opts.name).trim();
      if (name.length < 1 || name.length > 120) throw makeError('name');
      var gz = opts.projectGz;
      if (!(gz instanceof Blob) || !gz.size) throw makeError('shape', 'IvritProjects: projectGz must be a non-empty Blob');
      if (gz.size > MAX_GZ) throw makeError('project_too_big');
      var sources = (opts.sources || []).slice();
      var seen = {};
      sources.forEach(function (s) {
        if (!s || !SOURCE_NAME.test(String(s.name || ''))) throw makeError('shape', 'IvritProjects: bad source name');
        if (seen[s.name]) throw makeError('shape', 'IvritProjects: duplicate source name ' + s.name);
        seen[s.name] = true;
        var size = Number(s.size || (s.blob && s.blob.size) || 0);
        if (size > MAX_SOURCE) { var e = makeError('file_too_big'); e.label = s.label || s.name; throw e; }
      });
      var progress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};
      var meta = safeMeta(opts.meta);
      var created = false, row = null, gzPath = null;

      var step = opts.id
        ? get(opts.id).then(function (r) {
            if (!r) throw makeError('not_found');
            if (opts.expectedUpdatedAt && r.updated_at !== opts.expectedUpdatedAt) throw makeError('changed');
            return r;
          })
        : withClient(function (c) { return c.from('font_projects').insert(Object.assign({ name: name }, meta)).select(ROW_COLS).single(); })
            .then(function (r) { created = true; invalidate(); return r; });

      return step.then(function (r) {
        row = r;
        var folder = folderOf(u.id, row.id);
        var expected = row.updated_at;
        return listAll(BUCKETS.sources, folder).then(function (have) {
          var present = {};
          have.forEach(function (o) { present[o.name] = true; });
          var missing = sources.filter(function (s) { return !present[s.name]; });
          var lacking = missing.filter(function (s) { return !(s.blob instanceof Blob); });
          if (lacking.length) { var e = makeError('source_missing'); e.names = lacking.map(function (s) { return s.name; }); throw e; }
          var done = 0;
          progress({ phase: 'sources', done: 0, total: missing.length });
          return pool(missing, CONC, function (s) {
            return uploadObject(BUCKETS.sources, folder + '/' + s.name, s.blob, s.blob.type)
              .catch(function (err) {
                if (Number(err && (err.status || err.statusCode)) === 409) return null;   // uploaded meanwhile: fine
                if (err && (err.code === 'file_too_big' || err.code === 'bad_type') && !err.label) err.label = s.label || s.name;   // the message can name the letter
                throw err;
              })
              .then(function () { done++; progress({ phase: 'sources', done: done, total: missing.length }); });
          }).then(function () { return have; });
        }).then(function (have) {
          progress({ phase: 'project' });
          var rev = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          gzPath = folder + '/project-' + rev + '.json.gz';
          var keep = {}, sourcesBytes = 0;
          sources.forEach(function (s) { keep[s.name] = true; sourcesBytes += Number(s.size || (s.blob && s.blob.size) || 0); });
          return uploadObject(BUCKETS.project, gzPath, gz, 'application/gzip').then(function () {
            var patch = Object.assign({}, meta, { name: name, project_path: gzPath, project_bytes: gz.size, sources_bytes: sourcesBytes, has_images: sources.length > 0 });
            return withClient(function (c) { return c.from('font_projects').update(patch).eq('id', row.id).eq('updated_at', expected).select(ROW_COLS); })
              .then(function (rows) {
                if (!rows || !rows.length) throw makeError('changed');
                var saved = rows[0];
                invalidate();
                var stale = (row.project_path && row.project_path !== gzPath) ? [row.project_path] : [];
                removeObjects(BUCKETS.project, stale).catch(function (e) { warn('old project file not removed:', e); });
                var orphans = have.filter(function (o) { return !keep[o.name]; }).map(function (o) { return folder + '/' + o.name; });
                removeObjects(BUCKETS.sources, orphans).catch(function (e) { warn('unreferenced photos not removed:', e); });
                emit();
                return saved;
              }, function (err) {
                removeObjects(BUCKETS.project, [gzPath]).catch(function () {});   // the row never pointed at it
                throw err;
              });
          });
        });
      }).catch(function (err) {
        if (!(created && row)) throw err;
        return deleteRow(row.id).catch(function () {}).then(function () { invalidate(); throw err; });   // no half-made project stays behind — and the caller sees that once this settles
      });
    });
  }

  /* ---------- open / download ---------- */
  function open(id) {
    return get(id).then(function (row) {
      if (!row || !row.project_path) throw makeError('not_found');
      return downloadObject(BUCKETS.project, row.project_path).then(function (blob) { return blob.arrayBuffer(); }).then(function (buf) { return { row: row, gz: buf }; });
    });
  }
  function downloadSource(id, name) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      if (!isUuid(id) || !SOURCE_NAME.test(String(name || ''))) throw makeError('not_found');
      return downloadObject(BUCKETS.sources, folderOf(u.id, id) + '/' + name);
    });
  }
  function listSources(id) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      if (!isUuid(id)) throw makeError('not_found');
      return listAll(BUCKETS.sources, folderOf(u.id, id));
    });
  }

  /* ---------- remove ---------- */
  // Objects first, then the row: an orphaned row is visible and retryable, orphaned objects would not be.
  function remove(id) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      if (!isUuid(id)) throw makeError('not_found');
      var folder = folderOf(u.id, id);
      return removeFolder(BUCKETS.sources, folder)
        .then(function () { return removeFolder(BUCKETS.exports, folder); })
        .then(function () { return removeFolder(BUCKETS.project, folder); })
        .then(function () { return deleteRow(id); })
        .then(function () { invalidate(); emit(); return true; });
    });
  }

  /* ---------- exports ---------- */
  function saveExport(id, blob, name) {
    return Promise.resolve().then(function () {
      var u = ensureUser();
      if (!isUuid(id)) throw makeError('not_found');
      if (!(blob instanceof Blob) || !blob.size) throw makeError('shape', 'IvritProjects: the export must be a non-empty Blob');
      if (blob.size > MAX_EXPORT) { var e = makeError('file_too_big'); e.label = name || 'export'; throw e; }
      var file = fileStem(name || (blob.name) || 'font');
      var folder = folderOf(u.id, id);
      var path = folder + '/' + file;
      return uploadObject(BUCKETS.exports, path, blob, blob.type || 'application/octet-stream').then(function () {
        return listAll(BUCKETS.exports, folder).then(function (objs) {
          var older = objs.filter(function (o) { return o.name !== file; }).map(function (o) { return folder + '/' + o.name; });
          return removeObjects(BUCKETS.exports, older).catch(function (e) { warn('older export not removed:', e); });
        });
      }).then(function () {
        return withClient(function (c) { return c.from('font_projects').update({ export_path: path, exported_at: new Date().toISOString() }).eq('id', id).select(ROW_COLS).single(); });
      }).then(function (row) { invalidate(); emit(); return row; });
    });
  }
  function downloadExport(id) {
    return get(id).then(function (row) {
      if (!row || !row.export_path) throw makeError('not_found');
      return downloadObject(BUCKETS.exports, row.export_path).then(function (blob) { return { blob: blob, name: baseName(row.export_path) }; });
    });
  }

  /* ---------- summary ---------- */
  function count() {
    return list().then(function (rows) {
      var bytes = 0;
      rows.forEach(function (r) { bytes += Number(r.project_bytes || 0) + Number(r.sources_bytes || 0); });
      return { n: rows.length, bytes: bytes };
    });
  }

  /* ---------- public surface ---------- */
  window.IvritProjects = {
    list: list,
    get: get,
    save: save,
    open: open,
    downloadSource: downloadSource,
    listSources: listSources,
    remove: remove,
    saveExport: saveExport,
    downloadExport: downloadExport,
    count: count,
    refresh: function () { return list({ fresh: true }); },
    onChange: function (fn) { if (typeof fn === 'function' && listeners.indexOf(fn) < 0) listeners.push(fn); },
    errorCode: function (err) { return err && err.code ? String(err.code) : ''; },
    limits: { gz: MAX_GZ, source: MAX_SOURCE, export: MAX_EXPORT, projects: MAX_PROJECTS },
    _test: { normalise: normalise, safeMeta: safeMeta, pool: pool, fileStem: fileStem, isUuid: isUuid, SOURCE_NAME: SOURCE_NAME, ROW_COLS: ROW_COLS }
  };
})();
