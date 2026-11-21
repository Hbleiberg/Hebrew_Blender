#!/usr/bin/env node
/* smoke-classes.mjs — checks js/ivrit-classes.js's data layer (the shared class roster) without a browser: the
 * file is loaded in a vm with a stub localStorage, once per "device", and the merge laws, the migration of the
 * Dashboard's rosters and the Name Tags lists, the fold, deletions and file import are exercised. Zero
 * dependencies. Exits non-zero on the first failure. Run: node scripts/smoke-classes.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'js/ivrit-classes.js'), 'utf8');
const KEY = 'ivritSuite_classes', DASH = 'hebrewDashboard_settings', NT = 'hebrewNameTags_lists';

// One device: its own localStorage and its own copy of the module. `clock` lets a test put devices' edits in order.
function device(seed = {}, opts = {}) {
  const data = { ...seed };
  const ls = { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; } };
  let now = opts.now || 1760000000000;
  const FakeDate = { now: () => now };
  const ctx = { localStorage: ls, console, Date: FakeDate, Math, JSON, Map, Object, Array, String, Number, Infinity, parseInt, isFinite };
  ctx.globalThis = ctx;
  if (opts.session) ctx.IvritAccount = { hasStoredSession: () => true };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const C = ctx.IvritClasses;
  return { C, data, canon: C._test.canon, tick: (ms = 1000) => { now += ms; }, setNow: (v) => { now = v; },
           store: () => (data[KEY] ? JSON.parse(data[KEY]) : null), set: (k, v) => { data[k] = JSON.stringify(v); } };
}
const J = (v) => JSON.parse(JSON.stringify(v));
let n = 0;
const ok = (name) => { n++; console.log('  ok ' + name); };

const ROSTERS = { rosters: { a_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan', 'David K.', 'דָּוִד / David'] }, a_1: { name: 'My class', names: [] }, a_2: { name: 'Kitah Bet', names: ['Maya (aide)', 'רִבְקָה'] } },
                  activeRosterId: 'a_0', pickerSessions: { a_0: { picked: ['Noa'], absent: [] } } };
const LISTS = { 'Kitah Alef': { v: 1, rows: [{ he: 'נֹעָה', en: 'Noa' }, { he: '', en: 'Eitan' }, { he: '', en: 'David K.' }, { he: 'דוד', en: 'David', tr: 'Dovid' }], extra: 'Room 4' },
                'Gan': { v: 1, rows: [{ he: 'שִׁירָה', en: 'Shira', ex: 'Aide' }, { he: 'שִׁירָה', en: 'Shira' }], extra: '' } };

// ── 1. the merge laws ──
{
  const d = device(), C = d.C, canon = d.canon;
  const a = { id: 'c1', name: 'Alef', created: 5, updated: 9, students: [{ id: 's1', he: 'א', en: 'A' }, { id: 's2', he: '', en: 'B', t: { en: 8 } }], future: { x: 1 } };
  assert.equal(canon(C.mergeClass(J(a), J(a))), canon(a), 'a copy merged with itself is itself');
  const b = { id: 'c1', name: 'Alef 2', updated: 12, t: { name: 12 }, students: [{ id: 's2', he: 'בּ', en: 'Bee', t: { en: 11 } }, { id: 's3', he: 'ג', en: '' }], gone: { s1: { t: 10, he: 'א', en: 'A' } } };
  const ab = C.mergeClass(J(a), J(b)), ba = C.mergeClass(J(b), J(a));
  assert.equal(canon(ab), canon(ba), 'merge(a, b) and merge(b, a) are the same bytes');
  assert.equal(ab.name, 'Alef 2', 'the later-stamped name wins');
  assert.deepEqual(J(ab.students.map((s) => s.id)).sort(), ['s2', 's3'], 's1 stays deleted (no edit after its deletion), s3 is added');
  const s2 = ab.students.find((s) => s.id === 's2');
  assert.equal(s2.en, 'Bee', 'the later edit of a field wins');
  assert.equal(s2.he, 'בּ', 'an unstamped filled value beats an empty one');
  assert.deepEqual(J(ab.future), { x: 1 }, 'a field this build does not know survives');
  assert.equal(ab.created, 5); assert.equal(ab.updated, 12);
  ok('mergeClass: idempotent, symmetric, later stamp wins, unknown fields survive');

  const c = { id: 'c1', name: 'Alef', students: [{ id: 's1', he: 'אא', en: 'A', t: { he: 20 } }], updated: 20 };
  const order = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]].map(([x, y, z]) => canon(C.mergeClass(C.mergeClass(J(x), J(y)), J(z))));
  assert.equal(new Set(order).size, 1, 'three devices agree in any order');
  const all = C.mergeClass(C.mergeClass(J(a), J(b)), J(c));
  assert.ok(all.students.some((s) => s.id === 's1' && s.he === 'אא'), 'an edit after the deletion brings the student back');
  assert.ok(!all.gone || !all.gone.s1, 'and its deletion record goes');
  ok('mergeClass: three devices agree; an edit later than a deletion wins');

  const cleared = { id: 'c1', name: 'Alef', students: [{ id: 's2', he: '', en: 'B', tr: '', t: { tr: 30 } }] };
  const typed = { id: 'c1', name: 'Alef', students: [{ id: 's2', he: '', en: 'B', tr: 'Bee', t: { tr: 25 } }] };
  assert.equal(C.mergeClass(J(cleared), J(typed)).students[0].tr, '', 'a stamped clear beats an older value');
  assert.equal(C.mergeClass(J(typed), J(cleared)).students[0].tr, '');
  const o1 = { id: 'c', name: 'x', t: { students: 50 }, students: [{ id: 'b', he: '', en: 'b' }, { id: 'a', he: '', en: 'a' }] };
  const o2 = { id: 'c', name: 'x', students: [{ id: 'a', he: '', en: 'a' }, { id: 'b', he: '', en: 'b' }, { id: 'z', he: '', en: 'z' }] };
  assert.deepEqual(J(C.mergeClass(J(o2), J(o1)).students.map((s) => s.id)), ['b', 'a', 'z'], 'the later reorder leads; the other copy\'s own student follows');
  assert.equal(C.mergeClass(J(a), null) && C.mergeClass(null, J(a)).id, 'c1', 'a missing side is the other side');
  const hostile = JSON.parse('{"id":"c","name":"x","students":[{"id":"toString","he":"","en":"t"},{"id":"__proto__","he":"","en":"p"}],"gone":{"valueOf":{"t":1}}}');
  const hm = C.mergeClass(J(hostile), { id: 'c', name: 'x', students: [{ id: 'valueOf', he: '', en: 'v' }] });
  assert.deepEqual(J(hm.students.map((s) => s.id)).sort(), ['toString'], 'inherited names are plain ids; __proto__ is dropped; a deletion record named valueOf still counts');
  assert.equal({}.polluted, undefined);
  ok('mergeClass: a stamped clear wins, the later reorder leads, hostile ids are plain ids');
}

// ── 2. existing data: computed ids, the live view, nothing written ──
{
  const A = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) });
  const before = JSON.stringify(A.data);
  const view = A.C.list();
  assert.equal(JSON.stringify(A.data), before, 'reading the classes writes nothing');
  assert.deepEqual(J(view.map((c) => c.id)).sort(), ['a_0', 'a_2', A.C.list().find((c) => c.name === 'Gan').id].sort(), 'the starter "My class" is not a class; the matching list folds into its roster');
  const alef = A.C.get('a_0');
  assert.deepEqual(J(alef.students.map((s) => [s.he, s.en, s.tr])), [['נֹעָה', 'Noa', ''], ['', 'Eitan', ''], ['', 'David K.', ''], ['דָּוִד', 'David', 'Dovid']],
    'a one-script line is kept as typed ("David K."), a two-script line is divided, and the fold fills only what the roster lacks');
  assert.equal(alef.extra, 'Room 4', 'the list\'s extra line becomes the class\'s');
  assert.equal(alef.stored, false);
  const bet = A.C.get('a_2');
  assert.deepEqual(J(bet.students.map((s) => [s.he, s.en])), [['', 'Maya (aide)'], ['רִבְקָה', '']], 'punctuation in a one-script line survives');
  const gan = view.find((c) => c.name === 'Gan');
  assert.ok(/^nt_/.test(gan.id) && gan.students.length === 2 && gan.students[0].id !== gan.students[1].id, 'two rows with the same names are two students with different ids');
  assert.equal(gan.students[0].ex, 'Aide');
  ok('the live view: computed ids, the fold, nothing written');

  // two devices holding the same old data produce the same bytes
  const B = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) }, { now: 1790000000000 });
  A.C.adopt(); B.C.adopt();
  assert.equal(A.data[KEY], B.data[KEY], 'two devices that copy the same old data write the same bytes (no time stamp is minted)');
  const once = A.data[KEY];
  A.C.adopt();
  assert.equal(A.data[KEY], once, 'copying twice changes nothing');
  assert.equal(A.store().retired[A.C._test.ntSourcesFrom(LISTS).find((s) => s.name === 'Kitah Alef').id], 1, 'the folded list is recorded with a fixed stamp');
  assert.equal(A.data[DASH], JSON.stringify(ROSTERS), 'the Dashboard\'s key is untouched');
  assert.equal(A.data[NT], JSON.stringify(LISTS), 'the Name Tags key is untouched');
  ok('adopt: the same bytes on two devices, idempotent, old keys untouched');

  // a device that holds only the rosters, then meets the folded class by id
  const R = device({ [DASH]: JSON.stringify(ROSTERS) });
  R.C.adopt();
  const merged = R.C.mergeClass(R.store().classes.a_0, A.store().classes.a_0);
  assert.equal(R.canon(merged), R.canon(A.store().classes.a_0), 'the rosters-only copy and the folded copy merge to the folded one: same ids, nothing doubled');
  assert.equal(merged.students.length, 4);
  ok('a rosters-only device: one class, four students, after meeting the folded copy');

  // which old keys a hydration covered decides what is copied
  const P = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) });
  P.C.adopt({ dash: false, nt: true });
  assert.deepEqual(Object.keys(P.store().classes), [gan.id], 'a page that did not hear the Dashboard\'s rows copies only the lists — and folds nothing into a roster it did not copy');
  assert.equal(P.C.list().length, 3, 'the view still shows every class');
  ok('adopt covers only the old keys whose tool was heard from');
}

// ── 3. an edit on an old page: add-only, by id first ──
{
  const A = device({ [DASH]: JSON.stringify(ROSTERS) });
  A.C.adopt();
  const r2 = J(ROSTERS); r2.rosters.a_0.names.push('Dan');
  A.set(DASH, r2); A.C.adopt();
  assert.deepEqual(J(A.C.get('a_0').students.map((s) => s.en)), ['Noa', 'Eitan', 'David K.', 'David', 'Dan'], 'a line an old page added arrives as one student');
  const snap = A.data[KEY];
  A.C.adopt(); A.C.adopt();
  assert.equal(A.data[KEY], snap, '"David K." and the rest are not imported again (the next load writes nothing)');
  const sid = A.C.get('a_0').students.find((s) => s.en === 'Dan').id;
  A.tick(); assert.ok(A.C.removeStudent('a_0', sid));
  A.C.adopt();
  assert.ok(!A.C.get('a_0').students.some((s) => s.en === 'Dan'), 'a student deleted here is not re-added from the old line');
  A.tick(); assert.ok(A.C.setStudentField('a_0', A.C.get('a_0').students[0].id, 'en', 'Noah'));
  A.C.adopt();
  assert.deepEqual(J(A.C.get('a_0').students.map((s) => s.en)), ['Noah', 'Eitan', 'David K.', 'David'], 'a renamed student is not doubled by its old line (matched by id, not by name)');
  const r3 = J(r2); r3.rosters.a_0.names = r3.rosters.a_0.names.filter((x) => x !== 'Eitan');
  A.set(DASH, r3); A.C.adopt();
  assert.ok(A.C.get('a_0').students.some((s) => s.en === 'Eitan'), 'a line that disappeared on an old page removes nothing');
  ok('an old page\'s edit: one student added once; deletions and renames here hold');
}

// ── 4. operations: stamps, deletions, restore ──
{
  const A = device({ [DASH]: JSON.stringify(ROSTERS) });
  A.tick();
  const id = A.C.addClass('Gimel', [{ he: 'אַבְרָהָם', en: 'Avraham' }]);
  assert.ok(id && A.store().classes[id].students.length === 1 && A.store().classes[id].created, 'a class a person made is stamped');
  assert.ok(!A.store().classes.a_0, 'adding a class does not copy the old ones');
  assert.equal(A.C.addClass('Gimel') && A.C.list().filter((c) => /^Gimel/.test(c.name)).map((c) => c.name).sort().join('|'), 'Gimel|Gimel 1', 'a taken name gets the suite\'s "X 1"');
  A.tick(); assert.ok(A.C.renameClass('a_0', 'Alef!'));
  const st = A.store().classes.a_0;
  assert.ok(st && st.updated && st.t.name === st.updated && st.students.length === 4, 'editing a class that was only a view copies that one class, stamped');
  assert.ok(!A.store().classes.a_2, 'and no other');
  A.tick(); const sid = A.C.get('a_0').students[1].id;
  assert.ok(A.C.removeStudent('a_0', sid));
  assert.equal(A.C.get('a_0').gone.length, 1); assert.equal(A.C.get('a_0').gone[0].en, 'Eitan');
  A.tick(); assert.ok(A.C.restoreStudent('a_0', sid));
  const back = A.store().classes.a_0.students.find((s) => s.id === sid);
  assert.ok(back && back.en === 'Eitan' && back.t.en > 0 && !A.store().classes.a_0.gone, 'Restore brings the student back, stamped now');
  A.tick(); assert.ok(A.C.moveStudent('a_0', sid, 0));
  assert.equal(A.C.get('a_0').students[0].id, sid);
  const res = A.C.addStudents('a_0', [{ en: 'noa' }, { he: 'חַנָּה', en: 'Chana' }]);
  assert.deepEqual(J(res), { added: 1, filled: 0, same: 1, refused: 0 }, 'Add matches by name: one already there, one new');
  A.tick(); assert.ok(A.C.deleteClass('a_0'));
  assert.ok(!A.C.get('a_0') && !A.store().classes.a_0 && A.store().retired.a_0 > 0, 'a deleted class leaves the store and its id is recorded');
  A.C.adopt();
  assert.ok(!A.C.get('a_0'), 'and is never re-created from its old roster');
  assert.ok(A.C.get('a_2'), 'while the other old roster is copied');
  // a fresh device that only ever downloads the old roster and the record of the deletion
  const fresh = device({ [DASH]: JSON.stringify(ROSTERS), [KEY]: JSON.stringify({ v: 1, classes: {}, retired: { a_0: A.store().retired.a_0 } }) });
  fresh.C.adopt();
  assert.ok(!fresh.C.get('a_0') && !fresh.store().classes.a_0, 'a device that never held the class does not bring it back');
  // a deleted class a sync landing put back in the store (the tab that deleted it had an older view of it): hidden,
  // and removed again once the account has answered — but a class changed after its deletion is kept
  const relanded = A.store(), keptA2 = J(relanded.classes.a_2);
  relanded.classes.a_0 = { id: 'a_0', name: 'Kitah Alef', students: [{ id: 'sx', he: '', en: 'Noa' }], updated: relanded.retired.a_0 - 5 };
  relanded.retired.zz = relanded.retired.a_0; relanded.classes.zz = { id: 'zz', name: 'Edited since', students: [], updated: relanded.retired.a_0 + 5 };
  A.data[KEY] = JSON.stringify(relanded);
  assert.ok(!A.C.get('a_0') && A.C.get('zz'), 'the landed copy of a deleted class is hidden; one edited since its deletion shows');
  A.C.adopt({ dash: true, nt: true });
  assert.ok(A.store().classes.a_0, 'without the prune (the account not heard in this load) nothing is removed');
  A.C.adopt({ dash: true, nt: true, prune: true });
  assert.ok(!A.store().classes.a_0 && A.store().retired.a_0 && A.store().classes.zz, 'the prune takes the hidden class out and keeps the one edited since');
  assert.equal(A.canon(A.store().classes.a_2), A.canon(keptA2), 'and touches no other class');
  const prunedOnce = A.data[KEY]; A.C.adopt({ dash: true, nt: true, prune: true });
  assert.equal(A.data[KEY], prunedOnce, 'a second prune writes nothing');
  ok('operations: copy-on-edit, delete and restore a student, delete a class for good');
}

// ── 5. files ──
{
  const A = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) });
  const file = J(A.C.exportAll());
  assert.equal(Object.keys(file.classes).length, 3, 'a signed-out backup holds every class, the un-copied ones too');
  assert.equal(A.data[KEY], undefined, 'exporting writes nothing');
  // an old-format file on an empty device: twice, and on a second device, each class once
  const oldFile = { dashboardSettings: J(ROSTERS), nameTagLists: J(LISTS) };
  const B = device(), B2 = device({}, { now: 1790000000000 });
  assert.ok(B.C.importFile(J(oldFile), 'merge')); B2.C.importFile(J(oldFile), 'merge');
  assert.equal(B.C.list().length, 3);
  assert.equal(B.data[KEY], B2.data[KEY], 'an old file imported on two devices makes the same classes');
  const snap = B.data[KEY];
  assert.equal(B.C.importFile(J(oldFile), 'merge'), false, 'importing it again changes nothing');
  assert.equal(B.data[KEY], snap);
  assert.equal(B.C.get('a_0').students.length, 4, 'the file\'s roster and list fold as they do on a device');
  // a restore is a deliberate act: a deleted student comes back, from a Merge and from an account backup (fill) alike
  const sid = B.C.get('a_0').students[0].id;
  B.tick(); B.C.removeStudent('a_0', sid);
  assert.ok(B.C.importFile(J(oldFile), 'fill') && B.C.get('a_0').students.some((s) => s.id === sid) && B.C.get('a_0').students.length === 4, 'an account backup restores the deleted student, once');
  B.tick(); B.C.removeStudent('a_0', sid);
  assert.ok(B.C.importFile(J(oldFile), 'merge') && B.C.get('a_0').students.some((s) => s.id === sid), 'a Merge restores the deleted student');
  B.tick(); B.C.setStudentField('a_0', sid, 'en', 'Noah');
  assert.equal(B.C.importFile(J(oldFile), 'merge'), false, 'and never puts the file\'s older spelling back over what was typed since');
  // … and a deleted class
  B.tick(); B.C.deleteClass('a_2');
  assert.ok(B.C.importFile(J(oldFile), 'fill') && B.C.get('a_2'), 'a restore brings a deleted class back');
  // a file from this version carries both generations: its own classes are the truth, its old sections add nothing
  const C3 = device({ [DASH]: JSON.stringify(ROSTERS) });
  C3.C.adopt(); C3.tick(); C3.C.removeStudent('a_0', C3.C.get('a_0').students[3].id);
  const both = { classes: J(C3.C.exportAll()), dashboardSettings: J(ROSTERS) };
  const D = device();
  D.C.importFile(J(both), 'merge');
  assert.equal(D.C.get('a_0').students.length, 3, 'the file\'s stale roster does not re-add the student its class dropped');
  // a file never replaces what it does not contain, except the AllTools Replace
  const E = device(); E.C.addClass('Mine');
  E.C.importFile(J(oldFile), 'merge');
  assert.equal(E.C.list().length, 4, 'a Merge keeps this device\'s own class');
  E.C.importFile(J(oldFile), 'replace');
  assert.equal(E.C.list().length, 3, 'a Replace starts from the file');
  // the same old source already on this device as a view: nothing to copy
  const F = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) });
  assert.equal(F.C.importFile(J(oldFile), 'merge'), false, 'a file that adds nothing to the live view writes nothing');
  assert.equal(F.data[KEY], undefined);
  assert.equal(F.C.importFile({ nameTagSettings: {} }, 'merge'), false, 'a file with no class section is not for this store');
  ok('files: old sections import once, a restore brings back what was deleted and replaces nothing typed, only Replace replaces');
}

// ── 6. near-matches are never merged silently ──
{
  const lists = J(LISTS); lists['Kitah Alef'].rows.push({ he: '', en: 'Extra Kid' });
  const A = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(lists) });
  assert.equal(A.C.list().filter((c) => c.name === 'Kitah Alef').length, 2, 'same name, different students: two classes');
  const nm = J(A.C.nearMatches());
  assert.equal(nm.length, 1); assert.equal(nm[0].a, 'a_0');
  A.C.adopt();
  assert.ok(A.store().classes[nm[0].b] && !A.store().retired, 'both are copied; nothing is retired');
  A.tick(); assert.ok(A.C.mergeInto(nm[0].b, nm[0].a));
  assert.equal(A.C.get('a_0').students.length, 5, 'a confirmed merge adds only the student the roster lacked');
  assert.ok(!A.C.get(nm[0].b));
  const A2 = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(lists) });
  A2.C.dismissNearMatch(nm[0].key);
  assert.equal(A2.C.nearMatches().length, 0, '"Keep both" is remembered on this device');
  ok('a near-match stays two classes until a person merges them');
}

// ── 6b. what the owning page removes from its old key ──
{
  const A = device({ [DASH]: JSON.stringify(ROSTERS), [NT]: JSON.stringify(LISTS) });
  assert.deepEqual(J(A.C.scrub('dash')), { sources: [], lines: {}, rows: {} }, 'nothing was deleted: nothing to remove');
  A.C.adopt();
  assert.deepEqual(J(A.C.scrub('nt')), { sources: [], lines: {}, rows: {} }, 'a list only folded into its roster is not a deleted class: its old list stays');
  const noa = A.C.get('a_0').students[0].id, david = A.C.get('a_0').students[3].id;
  A.tick(); A.C.removeStudent('a_0', noa); A.tick(); A.C.removeStudent('a_0', david);
  assert.deepEqual(J(A.C.scrub('dash').lines), { a_0: ['Noa', 'דָּוִד / David'] }, 'a removed student\'s own line is named for removal from the old roster');
  assert.deepEqual(J(A.C.scrub('nt').rows), { 'Kitah Alef': [0, 3] }, 'and her row in the list that was folded into that roster');
  A.tick(); A.C.restoreStudent('a_0', noa);
  assert.deepEqual(J(A.C.scrub('dash').lines), { a_0: ['דָּוִד / David'] }, 'a restored student is no longer named');
  const gan = A.C.list().find((c) => c.name === 'Gan');
  A.tick(); A.C.removeStudent(gan.id, gan.students[1].id);
  assert.deepEqual(J(A.C.scrub('nt').rows.Gan), [1], 'of two rows with the same names, only the removed student\'s');
  A.tick(); A.C.deleteClass('a_2'); A.C.deleteClass(gan.id);
  assert.deepEqual(J(A.C.scrub('dash').sources), ['a_2'], 'a deleted class\'s old roster is named whole');
  assert.deepEqual(J(A.C.scrub('nt').sources), ['Gan'], 'and a deleted class\'s old list');
  A.tick(); A.C.deleteClass('a_0');
  assert.deepEqual(J(A.C.scrub('nt').sources).sort(), ['Gan', 'Kitah Alef'], 'deleting the folded class names the list that was folded into it too');
  ok('scrub: only what a teacher deleted is named, by student, and a fold is not a deletion');
}

// ── 7. CSV ──
{
  const { C } = device();
  const rows = J(C.csv.importRows(C.csv.parseDelimited('Hebrew,English,Class\nדָּוִד,"Cohen, David",3B\n,Shira,3B\n')));
  assert.deepEqual(rows, [{ he: 'דָּוִד', en: 'Cohen, David', ex: '3B' }, { he: '', en: 'Shira', ex: '3B' }]);
  assert.deepEqual(J(C.csv.importRows(C.csv.parseDelimited('David / דָּוִד\nרִבְקָה\n'))), [{ he: 'דָּוִד', en: 'David' }, { he: 'רִבְקָה', en: '' }], 'pasted lines are sorted by script');
  assert.equal(C.csv.text({ extra: 'Room 4', students: [{ he: 'דָּוִד', en: '=SUM(A1)', tr: '', ex: '' }] }), 'Hebrew,English,Transliteration,Extra\r\nדָּוִד,\'=SUM(A1),,Room 4\r\n', 'the export guards a formula and prints the class\'s extra line');
  assert.equal(C.csv.matchKey('  דָּוִד־בֶּן  '), 'דוד-בן');
  assert.deepEqual(J(C.csv.splitRosterLine('בַּת־שֶׁבַע - Batsheva')), { he: 'בַּת־שֶׁבַע', en: 'Batsheva' });
  ok('CSV: headers, script sorting, the export\'s formula guard');
}

// ── 8. a fold that is still only a view: deleting, backing up and restoring ──
{
  const R = { rosters: { a_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] }, b_0: { name: 'Kitah Bet', names: ['Ari'] } }, activeRosterId: 'a_0' };
  const L = { 'Kitah Alef': { v: 1, rows: [{ he: 'נֹעָה', en: 'Noa' }, { he: '', en: 'Eitan' }], extra: 'Room 4' } };
  const names = (d) => J(d.C.list().map(c => c.name + ':' + c.students.length)).sort().join(',');
  // deleting the one class a roster and its list make leaves nothing — the list does not step forward
  const A = device({ [DASH]: JSON.stringify(R), [NT]: JSON.stringify(L) });
  assert.equal(names(A), 'Kitah Alef:2,Kitah Bet:1');
  assert.ok(A.C.deleteClass('a_0'));
  assert.equal(names(A), 'Kitah Bet:1', 'a class deleted while its fold is only a view is gone, with the list it stood for');
  assert.ok(A.store().retired.a_0 > 1 && A.store().retired[A.C.idForList('Kitah Alef')] > 1, 'both ids are recorded as deleted');
  // the same, after only the roster was copied (a Dashboard page: it heard Dashboard, not Name Tags)
  const A2 = device({ [DASH]: JSON.stringify(R), [NT]: JSON.stringify(L) }, { session: true });
  A2.C.adopt({ dash: true, nt: false });
  assert.ok(A2.store().classes.a_0 && !A2.store().classes.a_0.fold, 'the roster class is stored without the fold');
  A2.tick(); assert.ok(A2.C.deleteClass('a_0'));
  assert.equal(names(A2), 'Kitah Bet:1', 'and deleting it still takes the list with it');
  // a backup from a device whose fold is only a view: the same device, a fresh one, and a Replace all hold one class
  const B = device({ [DASH]: JSON.stringify(R), [NT]: JSON.stringify(L) });
  const file = J({ classes: B.C.exportAll(), nameTagLists: L, dashboardSettings: R });
  assert.equal(file.classes.classes.a_0.fold, B.C.idForList('Kitah Alef'), 'the exported class says which old list it stands for');
  assert.equal(B.C.importFile(file, 'merge'), false, 'its own backup adds nothing to the device that made it');
  for (const mode of ['merge', 'replace']) {
    const F = device();
    assert.ok(F.C.importFile(J(file), mode));
    assert.equal(names(F), 'Kitah Alef:2,Kitah Bet:1', mode + ': a fresh device holds each class once');
    assert.equal(F.C.get('a_0').students[0].he, 'נֹעָה', 'with what the list added');
    F.set(NT, L); F.set(DASH, R);   // the old keys arrive later (the account's old rows)
    assert.equal(names(F), 'Kitah Alef:2,Kitah Bet:1', mode + ': and still once when the old list lands afterwards');
    F.C.adopt();
    assert.equal(names(F), 'Kitah Alef:2,Kitah Bet:1');
  }
  // an account backup: the fold written, a class deleted, its old roster row not yet cleaned — the record of deleted
  // classes is a section of its own there
  const acct = { classes: { v: 1, classes: { a_0: { id: 'a_0', name: 'Kitah Alef', fold: B.C.idForList('Kitah Alef'), students: [{ id: 'sx1', he: 'נֹעָה', en: 'Noa' }, { id: 'sx2', he: '', en: 'Eitan' }] } } },
                 classesRetired: { v: 1, retired: { [B.C.idForList('Kitah Alef')]: 1, b_0: 1760000001000 } }, dashboardRosters: { rosters: R.rosters }, nameTagLists: L };
  const G = device();
  assert.ok(G.C.importFile(J(acct), 'fill'));
  assert.equal(names(G), 'Kitah Alef:2', 'an account backup restores one class — not the folded list again, not the deleted class');
  G.set(NT, L); G.set(DASH, R); G.C.adopt();
  assert.equal(names(G), 'Kitah Alef:2,Kitah Bet:1', '(a class this device was never told is deleted comes from its old roster as before)');
  ok('a fold still only a view: delete takes the list too; a backup restores each class once, an account backup included');
}

// ── 9. ids that links hang on, and a move that is not an edit ──
{
  const A = device({ [DASH]: JSON.stringify({ rosters: { a_0: { name: 'Alef', names: ['Noa', 'Eitan', 'Dan'] }, b_0: { name: 'Bet', names: ['Ari'] }, c_0: { name: 'Gimel', names: ['Gal'] } } }) });
  A.C.adopt();
  // moving one class re-numbers all of them and edits none: a deletion made elsewhere still holds
  A.tick(); assert.ok(A.C.moveClass('b_0', -1));
  assert.ok(Object.values(A.store().classes).every(c => c.updated === undefined && typeof c.order === 'number'), 'a move writes every class its place and stamps none as edited');
  const st = A.store(); st.retired = { c_0: A.store().classes.c_0.t.order - 500 }; A.data[KEY] = JSON.stringify(st);   // deleted on another device, before the move
  assert.ok(!A.C.get('c_0'), 'so a class deleted elsewhere before the move stays deleted');
  // Replace keeps the students the new list still names (id, login), removes the rest, adds the new
  const before = A.C.get('a_0'), noa = before.students[0], eitan = before.students[1], dan = before.students[2];
  A.tick(); A.C.setStudentUsername('a_0', noa.id, 'noa.41');
  A.tick(); assert.ok(A.C.replaceStudents('a_0', [{ he: '', en: 'Dan' }, { he: 'נֹעָה', en: 'Noa' }, { he: '', en: 'Shira' }]));
  const after = A.C.get('a_0');
  assert.deepEqual(J(after.students.map(x => x.en)), ['Dan', 'Noa', 'Shira'], 'the class is the new list, in its order');
  assert.ok(after.students[0].id === dan.id && after.students[1].id === noa.id && after.students[1].username === 'noa.41' && after.students[1].he === 'נֹעָה', 'a student the list still names keeps the id and the login, and takes the list\'s values');
  assert.ok(after.students[2].id !== eitan.id && J(after.gone.map(g => g.id)).join() === eitan.id, 'only the student it no longer names is removed');
  // Merge into: a student who joins keeps the id and the login
  const ari = A.C.get('b_0').students[0];
  A.tick(); A.C.setStudentUsername('b_0', ari.id, 'ari.22');
  A.tick(); assert.ok(A.C.mergeInto('b_0', 'a_0'));
  const joined = A.C.get('a_0').students.find(x => x.en === 'Ari');
  assert.ok(joined && joined.id === ari.id && joined.username === 'ari.22' && !A.C.get('b_0'), 'Merge into carries the joining student\'s id and login');
  // the scrub names a row by its place in the stored list, whatever that list holds
  const N = device({ [NT]: JSON.stringify({ Gan: { v: 1, rows: [null, { he: '', en: 'Noa' }, 'x', { he: '', en: 'Dan' }], extra: '' } }) });
  const gid = N.C.idForList('Gan');
  N.C.adopt(); N.tick(); N.C.removeStudent(gid, N.C.get(gid).students[1].id);
  assert.deepEqual(J(N.C.scrub('nt').rows), { Gan: [3] }, 'a removed student\'s row is named by its index in the stored list');
  ok('a move stamps no class as edited; Replace and Merge into keep ids and logins; the scrub\'s row index is the stored one');
}

console.log(`smoke-classes: ${n} checks passed`);
