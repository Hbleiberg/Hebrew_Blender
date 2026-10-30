/*
 * ivrit-assignments.js — Torah Trainer reading assignments: the one module that talks to the assignment tables,
 * the manage-students Edge Function and the audio Worker. Loaded by torah_trainer.html (only with its
 * once a session is stored) and by reading_assignments.html, after /js/ivrit-account.js:
 *   <script src="/js/i18n.js" defer></script>
 *   <script src="/js/supabase-config.js" defer></script>
 *   <script src="/js/ivrit-account.js" defer></script>
 *   <script src="/js/ivrit-assignments.js" defer></script>
 *
 * Exposes window.IvritAssignments. Every call returns a Promise that resolves or rejects with an Error carrying
 * `code`; nothing throws into the page, and nothing here writes HTML — the pages render, with textContent only.
 * The database's policies decide who sees what (db/migrations/0008_reading_assignments.sql); this module only asks.
 *
 *   role() / isTeacher() / isStudent()      from the signed-in token (IvritAccount.role())
 *   classes.list/create/rename/remove       a teacher's classes
 *   students.list()                         a teacher's students with their display names and classes
 *   students.create(rows)                   [{display_name, username, password}] → the Edge Function; per-row results
 *   students.resetPassword(id, password) / students.remove(id) / students.setClass(id, classId)
 *   assignments.list()                      a teacher's assignments with per-assignment submission counts
 *   assignments.create(f) / update(id, f) / setOpen(id, open) / remove(id)
 *   submissions.listFor(assignmentId)       a teacher's view: every row, student names, feedback
 *   submissions.setStatus(id, 'approved'|'submitted') / submissions.remove(id)  (the Worker deletes object then row)
 *   feedback.save(submissionId, {comment, request_rerecord})   one overall comment, upserted
 *   claim(code)                             a student enters a code word → the assignment, or null when nothing matched
 *   my.assignments() / my.submissions()     a student's own, with the teacher's feedback
 *   peers(assignmentId)                     classmates' current uploads (empty unless the teacher allowed it)
 *   submissions.create({assignment_id, title, mime_type, duration_seconds})   the pending row before an upload
 *   upload(submissionId, blob, {mime, duration, onProgress})   PUT to the Worker with progress; marks the row uploaded
 *   audio(submissionId)                     Promise<Blob> — plays from a blob: URL; no shareable address exists
 *   recorder.supported() / recorder.pickMime() / recorder.create(opts)   MediaRecorder, mono, 32 kbps, timed
 *   codeWord.generate() / codeWord.normalize(s) / passphrase() / usernameFor(name, style) / deepLink(code)
 *     usernameFor styles: 'first.nn' (first name + '.' + two digits, the default), 'first.last', 'firstnn', 'flast'
 *     (first initial + last name), 'first.l' (first name + '.' + last initial); a name without a last name falls
 *     back to the digits; deepLink gives the Torah Trainer address that opens the assignment (?assignment=<code>)
 *   errorText(err)                          one localized sentence for any failure above
 */
(function () {
  'use strict';
  var WORKER_URL = 'https://recordings.ivritsuite.com';
  var AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  var BITS_PER_SECOND = 32000;
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function A() { return window.IvritAccount || null; }
  function t(key, fallback, params) {
    var v = null;
    try { if (window.I18n && window.I18n.t) { v = window.I18n.t(key, params); if (!v || v === key) v = null; } } catch (e) { v = null; }
    if (v === null) v = fallback;
    if (params && v) v = v.replace(/\{(\w+)\}/g, function (m, k) { return params[k] !== undefined ? String(params[k]) : m; });
    return v;
  }
  function makeError(code, message, extra) { var e = new Error(message || code); e.code = code; if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; }); return e; }
  function client() { var a = A(); if (!a) return Promise.reject(makeError('disabled', 'IvritAssignments: accounts are not loaded')); return a.client(); }
  function uid() { var a = A(); var u = a && a.user(); return u ? u.id : null; }
  function role() { var a = A(); return a && typeof a.role === 'function' ? a.role() : null; }
  function requireUser() { var id = uid(); if (!id) throw makeError('signed_out', 'IvritAssignments: not signed in'); return id; }
  function unwrap(r) { if (r && r.error) { var e = r.error; if (r.status && e && typeof e === 'object' && !e.status) { try { e.status = r.status; } catch (x) {} } throw e; } return r ? r.data : null; }
  // A cloud value is parsed through the same prototype-safe reviver as the saves module (never a bare JSON.parse).
  function safeParse(text) { return JSON.parse(text, function (k, v) { return (k === '__proto__' || k === 'constructor' || k === 'prototype') ? undefined : v; }); }
  function chunk(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }
  function uniq(arr) { var s = {}; return arr.filter(function (x) { if (s[x]) return false; s[x] = 1; return true; }); }

  /* ---------- words: code words and passphrases a child can type ---------- */
  // Short, concrete, unambiguous when read aloud; no homophone pairs (no "two"/"to"), no letters that look like digits.
  var WORDS = ('apple bear bird blue boat book cake calm camel candy cat chair cloud coat cold corn cow crab cup dance deer desk dog door ' +
    'drum duck eagle earth egg farm fern fire fish flag flute fog fox frog gate gift goat gold grape grass green hat hill honey horse ' +
    'house ice jam jet jump kite lake lamb lamp leaf lemon lion lunch map milk mint moon moth mouse nest nut oak ocean olive owl ' +
    'paint panda park pear pen piano pig pink plum pond rain red ring river road rock rose sail salt sand seal seed ship shoe ' +
    'silk sky snow sock song soup star stone sun swan table tent tiger toast tree tulip van vine wave wheat wind wolf wood yarn ' +
    'zebra amber bagel beach berry bloom brave bright brook cabin cedar chalk cherry clover comet coral cozy crisp daisy dawn dune ' +
    'ember fable feather fig flame fleet forest frost garden glow grove happy harp hazel heron jade jolly juniper kind lantern ' +
    'lily lucky maple marble meadow merry noble north orchid pebble pepper petal pine plume poppy prairie quiet raven ripple ' +
    'robin ruby sage shade shell shore silver smile sparrow spring sprout stork sunny swift thistle thunder tide timber topaz ' +
    'trail trout valley velvet violet walnut willow winter yellow').split(' ');
  function rnd(n) { return Math.floor(Math.random() * n); }
  function twoDigits() { var d = '23456789'; return d.charAt(rnd(8)) + d.charAt(rnd(8)); }   // no 0/1: nothing to mistake for O or l
  function wordPair() { var a = WORDS[rnd(WORDS.length)], b = WORDS[rnd(WORDS.length)]; while (b === a) b = WORDS[rnd(WORDS.length)]; return a + '-' + b; }
  function generateCode() { return wordPair() + '-' + twoDigits(); }       // sunny-fox-38
  function normalizeCode(s) { return String(s || '').toLowerCase().replace(/[\s\-_]/g, ''); }
  function passphrase() { return wordPair() + '-' + twoDigits(); }         // the same shape; 8+ characters always
  // A username from a display name: the first word's ASCII letters and digits, else "student", plus two digits.
  function asciiPart(s, max) {
    var base = s.normalize ? s.normalize('NFD') : s;
    return base.replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, max);
  }
  var USERNAME_STYLES = ['first.nn', 'first.last', 'firstnn', 'flast', 'first.l'];
  function usernameFor(name, style) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    var first = asciiPart(parts[0] || '', 20), last = asciiPart(parts.length > 1 ? parts[parts.length - 1] : '', 20);
    if (first.length < 2) first = 'student';
    if (USERNAME_STYLES.indexOf(style) < 0) style = 'first.nn';
    if (!last) style = style === 'first.nn' || style === 'firstnn' ? style : 'first.nn';   // a single name: the digits keep it unique
    var u;
    if (style === 'first.last') u = first + '.' + last;
    else if (style === 'flast') u = first.charAt(0) + last;
    else if (style === 'first.l') u = first + '.' + last.charAt(0);
    else if (style === 'firstnn') u = first + twoDigits();
    else u = first + '.' + twoDigits();
    u = u.slice(0, 30).replace(/\.$/, '');
    if (u.length < 3) u = (u + twoDigits()).slice(0, 30);
    return u;
  }
  function deepLink(code) {
    return location.origin + '/torah_trainer.html?assignment=' + encodeURIComponent(normalizeCode(code) ? String(code || '').trim() : '');
  }

  /* ---------- teachers ---------- */
  var classes = {
    list: function () { return client().then(function (c) { requireUser(); return c.from('classes').select('id, name, created_at').order('name'); }).then(unwrap); },
    create: function (name) { return client().then(function (c) { requireUser(); return c.from('classes').insert({ name: String(name || '').trim() }).select('id, name, created_at').single(); }).then(unwrap); },
    rename: function (id, name) { return client().then(function (c) { requireUser(); return c.from('classes').update({ name: String(name || '').trim() }).eq('id', id).select('id, name').single(); }).then(unwrap); },
    remove: function (id) { return client().then(function (c) { requireUser(); return c.from('classes').delete().eq('id', id).select('id'); }).then(unwrap).then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'class not found'); return true; }); }
  };

  function namesFor(c, ids) {
    ids = uniq(ids.filter(Boolean));
    if (!ids.length) return Promise.resolve({});
    return Promise.all(chunk(ids, 200).map(function (part) { return c.from('profiles').select('id, display_name').in('id', part).then(unwrap); }))
      .then(function (pages) { var map = {}; pages.forEach(function (rows) { (rows || []).forEach(function (r) { map[r.id] = String(r.display_name || ''); }); }); return map; });
  }
  var students = {
    list: function () {
      return client().then(function (c) {
        requireUser();
        return c.from('students').select('id, username, class_id, created_at').order('username').then(unwrap).then(function (rows) {
          rows = rows || [];
          return namesFor(c, rows.map(function (r) { return r.id; })).then(function (names) {
            return rows.map(function (r) { return { id: r.id, username: r.username, class_id: r.class_id, created_at: r.created_at, display_name: names[r.id] || r.username }; });
          });
        });
      });
    },
    create: function (rows) { return invoke('manage-students', { action: 'create', students: rows }).then(function (d) { return d.results || []; }); },
    resetPassword: function (id, password) { return invoke('manage-students', { action: 'reset_password', id: id, password: password }); },
    resetPasswords: function (ids, password) { return invoke('manage-students', { action: 'reset_passwords', ids: ids, password: password }).then(function (d) { return d.results || []; }); },
    remove: function (id) { return invoke('manage-students', { action: 'delete', id: id }); },
    setClass: function (id, classId) { return client().then(function (c) { requireUser(); return c.from('students').update({ class_id: classId || null }).eq('id', id).select('id, class_id'); }).then(unwrap).then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'student not found'); return rows[0]; }); }
  };
  function invoke(name, body) {
    return client().then(function (c) { requireUser(); return c.functions.invoke(name, { method: 'POST', body: body || {} }); })
      .then(function (r) {
        if (r && r.error) return functionError(r.error).then(function (e) { throw e; });
        var d = r && r.data;
        if (!d || d.ok !== true) throw makeError((d && d.error) || 'fn_failed', 'IvritAssignments: ' + name + ' failed');
        return d;
      });
  }
  function functionError(err) {
    var e = makeError('fn_failed', (err && err.message) || 'IvritAssignments: function failed');
    var ctx = err && err.context;
    var st = (ctx && typeof ctx.status === 'number') ? ctx.status : null;
    if (st === 401) e.code = 'signed_out';
    else if (st) e.code = 'fn_' + st;
    else if (/fetch|network/i.test(String(((err && err.name) || '') + ' ' + ((err && err.message) || '')))) e.code = navigator.onLine === false ? 'offline' : 'unreachable';
    e.status = st;
    if (ctx && typeof ctx.json === 'function') return ctx.json().then(function (body) { if (body && body.error) e.code = String(body.error); return e; }, function () { return e; });
    return Promise.resolve(e);
  }

  var ASSIGNMENT_COLS = 'id, title, code_word, ref, ref_label, reading, peers_can_listen, is_open, closed_at, max_minutes, due_date, retention_days, class_id, created_at, updated_at';
  function cleanAssignment(f) {
    var out = {};
    if (f.title !== undefined) out.title = String(f.title || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (f.code_word !== undefined) out.code_word = String(f.code_word || '').trim().slice(0, 40);
    if (f.ref !== undefined) out.ref = String(f.ref || '');
    if (f.ref_label !== undefined) out.ref_label = String(f.ref_label || '').trim().slice(0, 200);
    if (f.reading !== undefined) out.reading = (f.reading && typeof f.reading === 'object') ? f.reading : {};
    if (f.peers_can_listen !== undefined) out.peers_can_listen = !!f.peers_can_listen;
    if (f.is_open !== undefined) out.is_open = !!f.is_open;
    if (f.max_minutes !== undefined) out.max_minutes = Math.max(1, Math.min(30, Math.round(Number(f.max_minutes) || 10)));
    if (f.retention_days !== undefined) out.retention_days = Math.max(7, Math.min(180, Math.round(Number(f.retention_days) || 30)));
    if (f.due_date !== undefined) out.due_date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.due_date || '')) ? f.due_date : null;
    if (f.class_id !== undefined) out.class_id = f.class_id || null;
    return out;
  }
  var assignments = {
    list: function () {
      return client().then(function (c) {
        requireUser();
        return Promise.all([
          c.from('assignments').select(ASSIGNMENT_COLS).order('created_at', { ascending: false }).then(unwrap),
          c.from('submissions').select('assignment_id, student_id, is_current, status, upload_status').then(unwrap)
        ]).then(function (res) {
          var subs = res[1] || [], by = {};
          subs.forEach(function (s) {
            var b = by[s.assignment_id] || (by[s.assignment_id] = { students: {}, needs: 0, approved: 0 });
            if (s.is_current && s.upload_status === 'uploaded') { b.students[s.student_id] = 1; if (s.status === 'needs_rerecord') b.needs++; if (s.status === 'approved') b.approved++; }
          });
          return (res[0] || []).map(function (a) { var b = by[a.id]; a.submitted = b ? Object.keys(b.students).length : 0; a.needs_rerecord = b ? b.needs : 0; a.approved = b ? b.approved : 0; return a; });
        });
      });
    },
    get: function (id) { return client().then(function (c) { requireUser(); return c.from('assignments').select(ASSIGNMENT_COLS).eq('id', id).maybeSingle(); }).then(unwrap); },
    create: function (f) { return client().then(function (c) { requireUser(); return c.from('assignments').insert(cleanAssignment(f)).select(ASSIGNMENT_COLS).single(); }).then(unwrap); },
    update: function (id, f) { return client().then(function (c) { requireUser(); return c.from('assignments').update(cleanAssignment(f)).eq('id', id).select(ASSIGNMENT_COLS); }).then(unwrap).then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'assignment not found'); return rows[0]; }); },
    setOpen: function (id, open) { return assignments.update(id, { is_open: !!open }); },
    remove: function (id) { return client().then(function (c) { requireUser(); return c.from('assignments').delete().eq('id', id).select('id'); }).then(unwrap).then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'assignment not found'); return true; }); },
    members: function (id) { return client().then(function (c) { requireUser(); return c.from('assignment_members').select('student_id, joined_at').eq('assignment_id', id); }).then(unwrap); },
    // Every membership of the teacher's assignments (the class view's grid): the policy scopes the listing.
    allMembers: function () { return client().then(function (c) { requireUser(); return c.from('assignment_members').select('assignment_id, student_id, joined_at'); }).then(unwrap); },
    // The teacher enrols their own students (migration 0009's policy); one already enrolled is left as is.
    enrol: function (id, studentIds) {
      var rows = (studentIds || []).filter(function (x) { return typeof x === 'string' && x; }).map(function (sid) { return { assignment_id: id, student_id: sid }; });
      if (!rows.length) return Promise.resolve([]);
      return client().then(function (c) { requireUser(); return c.from('assignment_members').upsert(rows, { onConflict: 'assignment_id,student_id', ignoreDuplicates: true }).select('assignment_id, student_id'); }).then(unwrap).then(function (r) { return r || []; });
    },
    unenrol: function (id, studentId) { return client().then(function (c) { requireUser(); return c.from('assignment_members').delete().eq('assignment_id', id).eq('student_id', studentId).select('student_id'); }).then(unwrap).then(function (rows) { return !!(rows && rows.length); }); }
  };

  var SUBMISSION_COLS = 'id, assignment_id, student_id, title, version, is_current, mime_type, duration_seconds, size_bytes, upload_status, status, created_at, updated_at';
  // Every current take of the teacher's assignments, four columns (the class view's grid): the policy scopes it.
  function currentAll() { return client().then(function (c) { requireUser(); return c.from('submissions').select('assignment_id, student_id, status, upload_status').eq('is_current', true); }).then(unwrap).then(function (r) { return r || []; }); }
  function withFeedback(c, rows) {
    var ids = (rows || []).map(function (r) { return r.id; });
    if (!ids.length) return Promise.resolve(rows || []);
    return Promise.all(chunk(ids, 200).map(function (part) { return c.from('feedback').select('id, submission_id, comment, request_rerecord, created_at, updated_at').in('submission_id', part).then(unwrap); }))
      .then(function (pages) {
        var by = {}; pages.forEach(function (fs) { (fs || []).forEach(function (f) { by[f.submission_id] = f; }); });
        rows.forEach(function (r) { r.feedback = by[r.id] || null; });
        return rows;
      });
  }
  var submissions = {
    currentAll: currentAll,
    listFor: function (assignmentId) {
      return client().then(function (c) {
        requireUser();
        return c.from('submissions').select(SUBMISSION_COLS).eq('assignment_id', assignmentId).order('created_at', { ascending: false }).then(unwrap)
          .then(function (rows) { return withFeedback(c, rows || []); })
          .then(function (rows) {
            return namesFor(c, rows.map(function (r) { return r.student_id; })).then(function (names) { rows.forEach(function (r) { r.student_name = names[r.student_id] || ''; }); return rows; });
          });
      });
    },
    setStatus: function (id, status) {
      if (status !== 'approved' && status !== 'submitted') return Promise.reject(makeError('bad_status', 'status is approved or submitted'));
      return client().then(function (c) { requireUser(); return c.from('submissions').update({ status: status }).eq('id', id).select(SUBMISSION_COLS); }).then(unwrap)
        .then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'submission not found'); return rows[0]; });
    },
    remove: function (id) {
      return workerCall('POST', '/delete', { body: JSON.stringify({ submission_id: id }), type: 'application/json' }).then(function (r) { return r.json; });
    },
    create: function (f) {
      var row = { assignment_id: f.assignment_id, title: String(f.title || '').replace(/\s+/g, ' ').trim().slice(0, 80), mime_type: f.mime_type, duration_seconds: Math.max(0, Math.min(1800, Math.round(Number(f.duration_seconds) || 0))) };
      return client().then(function (c) { requireUser(); return c.from('submissions').insert(row).select(SUBMISSION_COLS).single(); }).then(unwrap);
    },
    retitle: function (id, title) {
      return client().then(function (c) { requireUser(); return c.from('submissions').update({ title: String(title || '').replace(/\s+/g, ' ').trim().slice(0, 80) }).eq('id', id).select(SUBMISSION_COLS); }).then(unwrap)
        .then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'submission not found'); return rows[0]; });
    }
  };
  var feedback = {
    save: function (submissionId, f) {
      var fields = { comment: String(f.comment || '').trim().slice(0, 2000), request_rerecord: !!f.request_rerecord };
      return client().then(function (c) {
        requireUser();
        return c.from('feedback').select('id').eq('submission_id', submissionId).maybeSingle().then(unwrap).then(function (existing) {
          var q = existing
            ? c.from('feedback').update(fields).eq('id', existing.id).select('id, submission_id, comment, request_rerecord, updated_at')
            : c.from('feedback').insert(Object.assign({ submission_id: submissionId }, fields)).select('id, submission_id, comment, request_rerecord, updated_at');
          return q.then(unwrap).then(function (rows) { if (!rows || !rows.length) throw makeError('not_found', 'feedback refused'); return rows[0]; });
        });
      });
    }
  };

  /* ---------- students ---------- */
  function claim(code) {
    return client().then(function (c) { requireUser(); return c.rpc('claim_assignment', { code: String(code || '') }); }).then(unwrap)
      .then(function (rows) { return (Array.isArray(rows) && rows.length) ? rows[0] : null; });
  }
  var my = {
    assignments: function () { return client().then(function (c) { requireUser(); return c.from('assignments').select(ASSIGNMENT_COLS).order('created_at', { ascending: false }); }).then(unwrap); },
    submissions: function () {
      return client().then(function (c) {
        var me = requireUser();
        return c.from('submissions').select(SUBMISSION_COLS).eq('student_id', me).order('created_at', { ascending: false }).then(unwrap).then(function (rows) { return withFeedback(c, rows || []); });
      });
    }
  };
  function peers(assignmentId) {
    return client().then(function (c) {
      var me = requireUser();
      return c.from('submissions').select('id, title, version, duration_seconds, created_at, student_id').eq('assignment_id', assignmentId).neq('student_id', me).eq('is_current', true).eq('upload_status', 'uploaded').order('created_at', { ascending: false });
    }).then(unwrap);
  }

  /* ---------- the Worker ---------- */
  function token() { var a = A(); return a && typeof a.accessToken === 'function' ? a.accessToken() : Promise.resolve(null); }
  function workerError(status, body) {
    var code = (body && body.error) || ('http_' + status);
    return makeError(code, 'IvritAssignments: the recording server answered ' + status, { status: status });
  }
  function workerCall(method, path, opts, retried) {
    opts = opts || {};
    return token().then(function (tk) {
      if (!tk) throw makeError('signed_out', 'IvritAssignments: not signed in');
      var headers = { authorization: 'Bearer ' + tk };
      if (opts.type) headers['content-type'] = opts.type;
      return fetch(WORKER_URL + path, { method: method, headers: headers, body: opts.body, credentials: 'omit' }).then(function (r) {
        if (r.status === 401 && !retried) return workerCall(method, path, opts, true);
        if (opts.blob) {
          if (!r.ok) return r.text().then(function (txt) { var b = null; try { b = safeParse(txt); } catch (e) {} throw workerError(r.status, b); });
          return r.blob().then(function (b) { return { status: r.status, blob: b }; });
        }
        return r.text().then(function (txt) {
          var b = null; try { b = txt ? safeParse(txt) : null; } catch (e) { b = null; }
          if (!r.ok) throw workerError(r.status, b);
          return { status: r.status, json: b };
        });
      }, function (e) { throw makeError(navigator.onLine === false ? 'offline' : 'unreachable', 'IvritAssignments: ' + String(e && e.message || e)); });
    });
  }
  function audio(submissionId) {
    if (!UUID_RE.test(String(submissionId))) return Promise.reject(makeError('not_found', 'bad id'));
    return workerCall('GET', '/audio/' + submissionId, { blob: true }).then(function (r) { return r.blob; });
  }
  // The upload: an XMLHttpRequest (fetch has no upload progress), one retry on 401 after the token is re-read.
  function upload(submissionId, blob, opts, retried) {
    opts = opts || {};
    if (!UUID_RE.test(String(submissionId))) return Promise.reject(makeError('not_found', 'bad id'));
    var mime = String(opts.mime || blob.type || '').replace(/\s+/g, '');
    if (AUDIO_TYPES.indexOf(mime) < 0) return Promise.reject(makeError('unsupported_type', 'IvritAssignments: not an accepted audio type'));
    var duration = Math.max(0, Math.min(1800, Math.round(Number(opts.duration) || 0)));
    return token().then(function (tk) {
      if (!tk) throw makeError('signed_out', 'IvritAssignments: not signed in');
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', WORKER_URL + '/upload/' + submissionId + '?duration=' + duration, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + tk);
        xhr.setRequestHeader('Content-Type', mime);
        xhr.responseType = 'text';
        if (xhr.upload && typeof opts.onProgress === 'function') {
          xhr.upload.addEventListener('progress', function (e) { if (e.lengthComputable) { try { opts.onProgress(e.loaded, e.total); } catch (x) {} } });
        }
        xhr.onload = function () {
          var body = null; try { body = xhr.responseText ? safeParse(xhr.responseText) : null; } catch (e) { body = null; }
          if (xhr.status === 401 && !retried) { resolve(upload(submissionId, blob, opts, true)); return; }
          if (xhr.status >= 200 && xhr.status < 300) resolve(body);
          else reject(workerError(xhr.status, body));
        };
        xhr.onerror = function () { reject(makeError(navigator.onLine === false ? 'offline' : 'unreachable', 'IvritAssignments: upload failed')); };
        xhr.onabort = function () { reject(makeError('aborted', 'IvritAssignments: upload aborted')); };
        xhr.send(blob);
        if (typeof opts.onStart === 'function') { try { opts.onStart(xhr); } catch (e) {} }
      });
    });
  }

  /* ---------- the recorder ---------- */
  function recorderSupported() {
    return !!(window.MediaRecorder && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && window.isSecureContext !== false);
  }
  function pickMime() {
    if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return '';
    for (var i = 0; i < AUDIO_TYPES.length; i++) { try { if (MediaRecorder.isTypeSupported(AUDIO_TYPES[i])) return AUDIO_TYPES[i]; } catch (e) {} }
    return '';
  }
  // The type the row and the upload carry: one of AUDIO_TYPES, from whatever the recorder reports.
  function rowMime(reported, chosen) {
    var m = String(reported || chosen || '').replace(/\s+/g, '').toLowerCase();
    if (AUDIO_TYPES.indexOf(m) >= 0) return m;
    if (m.indexOf('audio/webm') === 0) return 'audio/webm';
    if (m.indexOf('audio/mp4') === 0) return 'audio/mp4';
    if (m.indexOf('audio/ogg') === 0) return 'audio/ogg;codecs=opus';
    return chosen || '';
  }
  // create({ maxSeconds, onTick(seconds), onStop({blob, mime, seconds}), onError(err) }) → { start(), stop(), cancel(), state() }
  // start() resolves once the microphone is open; it rejects with code mic_denied | no_mic | unsupported | mic_failed.
  // The elapsed time is the page's own clock (a WebM from MediaRecorder carries no duration), and the recording stops
  // itself at maxSeconds. stop() keeps the take; cancel() drops it. Every path releases the microphone.
  function createRecorder(opts) {
    opts = opts || {};
    var maxSeconds = Math.max(5, Math.min(1800, Number(opts.maxSeconds) || 600));
    var state = 'idle', rec = null, stream = null, chunks = [], startedAt = 0, timer = null, chosen = '', cancelled = false;
    function release() {
      if (timer) { clearInterval(timer); timer = null; }
      if (stream) { try { stream.getTracks().forEach(function (tr) { tr.stop(); }); } catch (e) {} stream = null; }
    }
    function seconds() { return startedAt ? Math.min(maxSeconds, Math.floor((Date.now() - startedAt) / 1000)) : 0; }
    function finish() {
      var s = seconds();
      release();
      state = 'idle';
      if (cancelled) { chunks = []; return; }
      var mime = rowMime(rec && rec.mimeType, chosen);
      var blob = new Blob(chunks, { type: mime.split(';')[0] });
      chunks = [];
      if (typeof opts.onStop === 'function') { try { opts.onStop({ blob: blob, mime: mime, seconds: s }); } catch (e) {} }
    }
    function start() {
      if (state !== 'idle') return Promise.reject(makeError('busy', 'recorder busy'));
      if (!recorderSupported()) return Promise.reject(makeError('unsupported', 'MediaRecorder is not available'));
      chosen = pickMime();
      if (!chosen) return Promise.reject(makeError('unsupported', 'no audio type is supported'));
      state = 'starting'; cancelled = false; chunks = [];
      return navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        .then(function (st) {
          stream = st;
          try { rec = new MediaRecorder(st, { mimeType: chosen, audioBitsPerSecond: BITS_PER_SECOND }); }
          catch (e) { rec = new MediaRecorder(st, { mimeType: chosen }); }
          rec.addEventListener('dataavailable', function (e) { if (e.data && e.data.size) chunks.push(e.data); });
          rec.addEventListener('stop', finish);
          rec.addEventListener('error', function (e) { release(); state = 'idle'; if (typeof opts.onError === 'function') opts.onError(makeError('mic_failed', String(e && e.error && e.error.message || 'recorder error'))); });
          rec.start(1000);
          startedAt = Date.now();
          state = 'recording';
          timer = setInterval(function () {
            var s = seconds();
            if (typeof opts.onTick === 'function') { try { opts.onTick(s, maxSeconds); } catch (e) {} }
            if (s >= maxSeconds) stop();
          }, 250);
        }, function (err) {
          release(); state = 'idle';
          var name = err && err.name;
          throw makeError(name === 'NotAllowedError' || name === 'SecurityError' ? 'mic_denied' : (name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no_mic' : 'mic_failed'), String(err && err.message || name || 'microphone'));
        });
    }
    function stop() { if (state !== 'recording') return; state = 'stopping'; try { rec.stop(); } catch (e) { finish(); } }
    function cancel() { if (state === 'idle') return; cancelled = true; if (state === 'recording') { state = 'stopping'; try { rec.stop(); } catch (e) { finish(); } } else { release(); state = 'idle'; } }
    return { start: start, stop: stop, cancel: cancel, state: function () { return state; }, seconds: seconds, mime: function () { return chosen; } };
  }

  /* ---------- errors, one sentence each ---------- */
  function errorText(err) {
    var code = String((err && err.code) || ''), st = err && err.status, msg = String((err && err.message) || '').toLowerCase();
    var a = A();
    if (code === 'offline' || code === 'unreachable' || /failed to fetch|networkerror|load failed/.test(msg)) return t('assign.error.offline', 'This needs an internet connection. Check the connection and try again.');
    if (code === 'signed_out' || code === 'PGRST301' || st === 401 || code === 'unauthorized') return t('shared.cloud.error_session', 'Your sign-in has expired. Sign in again.');
    if (code === 'too_many_attempts' || /too_many_attempts/.test(msg)) return t('assign.error.too_many', 'Too many tries. Wait ten minutes, then try the code word again.');
    if (code === 'not_a_student' || /not_a_student/.test(msg)) return t('assign.error.not_student', 'Only a student account can enter a code word.');
    if (code === 'student_forbidden') return t('assign.error.teacher_only', 'Only a teacher account can do this.');
    if (code === 'username_taken') return t('assign.error.username_taken', 'That username is already taken. Choose another.');
    if (code === 'invalid_username') return t('assign.error.username_invalid', 'A username is 3 to 30 lowercase letters, digits and dots.');
    if (code === 'invalid_password') return t('assign.error.password_invalid', 'A password is 8 to 72 characters.');
    if (code === 'invalid_name') return t('assign.error.name_invalid', 'Each student needs a name.');
    if (code === 'too_many_students') return t('assign.error.too_many_students', 'An account can have at most 200 students.');
    if (code === '23505') return t('assign.error.code_taken', 'You already use that code word for another assignment. Choose a different one.');
    if (code === '23514' || code === '22P02') return t('assign.error.out_of_range', 'Something in the form is out of range. Check the code word (6 to 40 letters and digits), the minutes and the dates.');
    if (code === '42501' || code === 'forbidden' || st === 403) return t('assign.error.refused', 'That is not allowed for this account.');
    if (code === 'not_found' || st === 404) return t('assign.error.not_found', 'That item no longer exists.');
    if (code === 'closed') return t('assign.error.closed', 'This assignment is closed; it no longer takes recordings.');
    if (code === 'not_accepted') return t('assign.error.not_accepted', 'This recording cannot be replaced any more. Record a new one instead.');
    if (code === 'too_large' || st === 413) return t('assign.error.too_large', 'The recording is too long for this assignment. Record a shorter one.');
    if (code === 'unsupported_type' || st === 415) return t('assign.error.unsupported_type', 'This browser records in a format the server does not accept.');
    if (code === 'rate_limited' || st === 429) return t('shared.account.error_rate_limited', 'Too many attempts. Wait a few minutes and try again.');
    if (code === 'missing') return t('assign.error.missing', 'The audio for this recording is gone. Ask for a new recording.');
    if (code === 'mic_denied') return t('assign.error.mic_denied', 'The microphone is blocked. Allow the microphone for this site in the browser\'s address bar, then try again.');
    if (code === 'no_mic') return t('assign.error.no_mic', 'No microphone was found. Plug one in or check the sound settings, then try again.');
    if (code === 'unsupported') return t('assign.error.unsupported', 'This browser cannot record audio. Try a current Chrome, Edge, Firefox or Safari.');
    if (code === 'mic_failed') return t('assign.error.mic_failed', 'The microphone stopped working. Try again.');
    if (code === 'aborted') return t('assign.error.aborted', 'The upload was stopped.');
    if (a && typeof a.errorText === 'function' && (code === 'blocked' || code === 'disabled')) return a.errorText(err);
    return t('assign.error.generic', 'Something went wrong. Try again in a moment.');
  }

  window.IvritAssignments = {
    WORKER_URL: WORKER_URL,
    role: role,
    isTeacher: function () { return role() === 'teacher'; },
    isStudent: function () { return role() === 'student'; },
    codeWord: { generate: generateCode, normalize: normalizeCode },
    passphrase: passphrase,
    usernameFor: usernameFor,
    USERNAME_STYLES: USERNAME_STYLES.slice(),
    deepLink: deepLink,
    classes: classes,
    students: students,
    assignments: assignments,
    submissions: submissions,
    feedback: feedback,
    claim: claim,
    my: my,
    peers: peers,
    upload: upload,
    audio: audio,
    recorder: { supported: recorderSupported, pickMime: pickMime, create: createRecorder, rowMime: rowMime },
    errorText: errorText,
    _test: { WORDS: WORDS, normalizeCode: normalizeCode, usernameFor: usernameFor, rowMime: rowMime, safeParse: safeParse }
  };
})();
