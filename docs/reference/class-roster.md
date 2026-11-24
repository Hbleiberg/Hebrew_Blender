# The shared class roster (`ivritSuite_classes`)

> How the shared classes work. Binding rules live in `CLAUDE.md`; keep this file free of session ids, dates,
> digests and line numbers.

One class and its students, entered once and used by the Classroom Dashboard, Name Tags, Flash Cards and
the Torah Trainer's reading assignments. Modeled on the suite-wide word lists (`ivritSuite_wordLists`).

## 1. Design choices

| Question | Choice | Why |
|---|---|---|
| Where the shared code lives | One file, `js/ivrit-classes.js` (data, the editor and its CSS), loaded by each carrier and precached — not a pasted `═══` block | One copy of the code that handles student names; Node can load it for the migration tests; no sha check across five carriers. The repo already ships shared engines this way (`js/trope-staff.js`, `js/coloring-art.js`) |
| Which account tool the rows sync under | Its own tool value, `Classes` | `Suite` is skipped by the sign-out removal on purpose, so student names would stay on a shared device; an existing tool's kinds would reach other pages' re-read hooks under names they already use (`settings`). Costs migration `0013` (accounts rule 7) |
| Mirrors of the old keys | None. No page writes `hebrewDashboard_settings.rosters` or `hebrewNameTags_lists`, except to remove what a teacher deleted (§7.7) | Writing them doubles classes in two measured ways: an old Dashboard page saves its whole settings blob from memory, so an open old tab overwrites a mirror another page wrote and uploads the stale class; and Name Tags lists sync as keep-both items, so two devices' mirrors meeting in the account make a "(from another device)" list |
| An edit made on an old cached page | Imported, add-only: new students added, blanks filled, nothing removed or replaced (§7.5) | Nothing typed on an old page is lost. Accepted cost: a student deleted on a current page can come back if an old page still lists them |

## 2. The old stores this replaces

The legacy reader (§7) reads these shapes; nothing writes them any more.

- A Dashboard class was `settings.rosters[id] = { name, names }` where `names` is an **array of one-line
  strings** — a student was one free-text line, never split into Hebrew and English.
  `pickerSessions[id] = { picked, absent }` held those **name strings**, and a preset carried the class
  **name** (`activeRosterName`), never an id.
- Name Tags lists were keyed by **list name** in `hebrewNameTags_lists` (sync shape `map`, merge `item`,
  which keeps both copies on a conflict): `{ v: 1, rows: [{ he, en, tr?, ex? }], extra }`.
- `ivritSuite_wordLists`, the model, syncs under the tool **`Dictionary`**; pages reach it with
  `alsoPull: ['Dictionary']`. It is not a `Suite` row — and neither are the classes.
- Neither the Dashboard nor Name Tags has a `?s=` link. Flash Cards' link carries its settings only, and its
  settings have no profile field — so no share link carries a student's name.
- An account student has **one** display name, which the teacher cannot change after the account is made;
  creating accounts takes no class (the page sets each new student's class afterwards).

## 3. The store

`localStorage['ivritSuite_classes']`:

```jsonc
{
  "v": 1,
  "classes": {
    "<classId>": {
      "id": "<classId>",
      "name": "Kitah Alef",
      "extra": "Room 4 · Morah Rivka",     // one line for the whole class
      "order": 3,
      "created": 1760000000000,            // absent on a class that was only migrated
      "updated": 1760000000000,            // absent on a class that was only migrated
      "students": [
        { "id": "<studentId>", "he": "דָּוִד", "en": "David", "tr": "Dovid", "ex": "Aide", "username": "david.41",
          "t": { "en": 1760000000000 } }
      ],
      "gone": { "<studentId>": { "t": 1760000000000, "he": "…", "en": "…" } },
      "t": { "name": 1760000000000, "order": 1760000000000 },
      "fold": "nt_<hash>",
      "accountClassId": "<uuid>"
    }
  },
  "retired": { "<classId>": 1760000000000 }
}
```

| Field | Why it exists |
|---|---|
| `classes` keyed by a stable `id` | A rename never breaks a link; the id is the account row's name |
| `name` | The label every tool shows; unique names are not required (two teachers' "Kitah Alef" may meet in one account) but the editor suggests "X 1" as the other lists do |
| `extra` | Name Tags' "extra line on every tag in this list" (a room, a teacher, a grade) |
| `order` | The class's place in every menu; ties fall back to the name, then the id |
| `created` / `updated` | When a person made or last changed the class. **Absent on a class that was only migrated**, so two devices that migrate the same old data produce the same bytes |
| `students` (an array) | The array order is the class order — the print order, the picker's order, the CSV's |
| student `id` | Stable, so a rename keeps a Flash Cards profile, a pick session or an account link attached |
| `he` / `en` | The two names Name Tags always kept; an old Dashboard line is sorted into them by script (§7.1) |
| `tr` | A transliteration typed by hand. The automatic one is computed where it prints and is never stored, so it cannot differ between devices |
| `ex` | Name Tags' per-student extra line: it replaces the class's `extra` for that one student |
| `username` | Present only once the student has a reading-assignments login noted on it (§6.4) |
| `t` (on a student or a class) | The time each field was last edited by a person, only for fields edited after creation. It is what lets "the later edit wins" hold field by field |
| `gone` | Deleted students: the time, and the two names so the editor can offer **Restore**. Without it a merge of two devices' copies would bring a deleted student back. Capped at the newest 400 per class, never dropped by age (an old backup or a device unused for a year would otherwise resurrect every student deleted long ago) |
| `fold` | The id of the old Name Tags list that was folded into this class (§7.4), so deleting the class also retires the list and the scrub (§7.7) knows whose rows the list's are |
| `retired` | Deleted classes, by id. Without it a class deleted on one device is re-created on another from that device's old roster (§7) |
| `accountClassId` | Present only once the class is linked to a reading-assignments class |

**Left out on purpose: `note`.** No tool reads it, and free text about a child in an account is a new kind
of data under accounts rule 8. Unknown fields survive every merge and import, so it can be added later
without a migration.

**Limits:** 40 classes, 200 students a class, 120 characters a field or class name (the Dashboard's picker
keeps its own 60 for what it shows at once). A refusal is an inline note.

**Nothing is written on load.** No page mints an empty "My class"; an empty state offers *Add a class*
instead. So no seed can ever reach an account.

**Time stamps** come from `max(Date.now(), the highest stamp already in the class + 1)`, so a device with a
slow clock can still make an edit that counts as later than what it is editing.

## 4. The account rows

Two rows in `IVRIT_SYNC_REGISTRY`, both under the tool `Classes`, which goes **before** `Dashboard` in
`var TOOLS` (a hydration runs in that order, so the classes land before the old rosters are looked at). The
whole-key row is listed **first**, as the Dashboard's settings row is listed before its rosters: rows land in
registry order, and a class landing first would create the key under the record's own download.

```js
{ tool: 'Classes', kind: 'retired', lsKey: 'ivritSuite_classes', shape: 'single', merge: 'deepMax', omit: ['classes'],
  ivritKey: 'classesRetired', label: 'shared.cloud.kind_class_removed', skipUpload: /* no class was ever deleted */ },
{ tool: 'Classes', kind: 'class', lsKey: 'ivritSuite_classes', shape: 'mapIn', path: 'classes', nameField: 'name',
  envelope: { v: 1 }, merge: 'page', ivritKey: 'classes', label: 'shared.cloud.kind_roster' }
```

Two entries on one key is the Dashboard's own pattern (its settings row omits the rosters its roster rows
carry). The `retired` row uses the module's built-in `deepMax`, so every page — the hub included — can
resolve it with no page code; an empty record is never sent (`skipUpload`), and the store never holds an empty
`retired` (it would read as a change to that row).

- **One row per class**, named by the class id, labelled by its name.
- **The tool value is in `saves.tool`'s CHECK** through `db/migrations/0013_saves_tool_classes.sql`
  (accounts rule 7). A project without it answers every class upload with `23514`; the class then stays whole
  on the device and goes up by itself at the first load after the tool is accepted.
- **Every page that shows classes** — the Dashboard, Name Tags, Flash Cards, the reading-assignments page and
  the hub — passes `alsoPull: ['Classes']`, `merges: { class: IvritClasses.mergeClass }` and an
  `onLocalChanged` branch for `class` / `retired` that calls `IvritClasses.landed()`. The Dashboard also keeps
  its old `roster` merge and re-reads its settings blob when an old roster lands (the live view reads it).
- **`js/ivrit-saves.js` carries only** the `TOOLS` entry, the `TOOL_NAMES` entry and the two rows. No hook
  exists for a tool reached through `alsoPull`: the editor redraws around whatever holds the focus, keeping
  what is typed but not yet saved, so a class landing from another tab or device needs no waiting.

### `mergeClass(a, b)` — pure, lossless, never a dialog

Run by the module only when both sides changed since the last sync. It gives the same answer whichever side
is called "mine", and merging a copy with itself changes nothing.

- **Students are unioned by `id`.**
- **A field both copies hold:** the later stamp wins. With no stamp on either side (migrated data), a filled
  value beats an empty one, and two different filled values keep the one that sorts later (arbitrary, but
  the same on every device). A stamped *clear* wins over an older value — clearing a typed transliteration
  on purpose is not undone.
- **A deleted student** (`gone`) stays deleted unless the other copy edited that student **after** the
  deletion: the later human action wins (accounts rule 7).
- **Order:** the copy whose students were reordered later (`t.students`) gives the order; students only the
  other copy has are appended. (`t.order` stamps the class's own place among the classes.)
- **`created`** is the earlier, **`updated`** the later; **unknown fields** survive.

### Deletions

- **A deleted class** is removed from `classes` and its id is written to `retired`, with the id of the list
  it stands for — whether that fold was written (`fold`) or is still only a view on this device; otherwise the
  list would step forward as a class of its own the moment its roster class was gone. The row leaves the account like any deleted item; another device that still holds it keeps
  a copy in its recovery bin (`ivritSuite_removedByAccount`), offered for download until dismissed. The
  confirm names the account-wide effect while a session is stored (`IvritAccount.hasStoredSession()`).
- **A class is shown only if** it is not in `retired`, or it was edited after it was retired (a device that
  changed it since re-adds it).
- **A deleted class that is in the store again goes out again.** The sync module lands a row back when the
  tab that deleted it had an older view of it (another tab changed the class a moment before, so that tab's
  flush never deletes by absence). The landed copy is hidden by `retired`, but its students' names would stay
  on the device and in the account for good — so once a hydration in this page load has answered for
  `Classes` (or signed out, at load) every stored class that is retired and not edited since is removed, and
  that removal is one the module sends on.
- **A deleted student** is kept in the class's own `gone` list with the two names, and the editor offers
  *Restore* there — instead of the recovery bin, which never evicts and would fill with routine removals.
- **A landing never rewrites the row that landed.** Nothing clock-based or version-based runs in the
  re-read path, or every page load on every device would send one write, forever.

## 5. Who writes the store: `js/ivrit-classes.js`

**Only this file writes `ivritSuite_classes`.** A tool page never does. It talks to no server (accounts
rule 2 is untouched) and exposes `window.IvritClasses`:

| Part | What it does |
|---|---|
| `list()`, `get(id)`, `onChange(fn)`, `landed()` | What every tool reads. `list()` returns the stored classes plus the not-yet-copied old ones (§7.2), each as `{ id, name, extra, order, students, gone, accountClassId, stored }`. `onChange` fires on this page's writes, on another tab's (`storage`), and when the page's `onLocalChanged` calls `landed()` |
| Operations (`addClass`, `renameClass`, `setClassExtra`, `duplicateClass`, `moveClass`, `deleteClass`, `mergeInto`, `addStudent`, `addStudents`, `replaceStudents`, `setStudentField`, `removeStudent`, `restoreStudent`, `moveStudent`, `setLink`, `setStudentUsername`) | **Each one re-reads the store, applies one stamped change, and writes.** Nothing holds a whole class in memory and writes it back, so a class another tab or device just sent is never overwritten. An operation on a class that is still only a live view copies that one class first. **A student's id is kept wherever the student is still the same child:** `replaceStudents` keeps the id (and the login noted on it) of every student the new list still names, and `mergeInto` carries the id and login of a student who joins — a Flash Cards profile, a pick session and a reading-assignments login hang on that id. **`moveClass` is not an edit:** it writes every class its place (`order`, `t.order`) and never sets `updated`, because `updated` is what brings a class back over a deletion made elsewhere |
| `mergeClass` | §4 |
| The legacy reader | The live view, the copy step (`adopt`), the fold, the add-only import of an old page's edits, `nearMatches()` / `dismissNearMatch()` (§7) |
| `idForList(name)`, `idForLine(classId, line)` | The computed id of an old Name Tags list, and of the student an old roster line is — how a page turns what it remembered by name (an open list, a pick session) into ids |
| `scrub(from)`, `watchScrub(from, tool, fn)` | What the owning page must remove from its old key (§7.7) |
| `importFile(data, mode)`, `exportAll()` | `.ivrit` and AllTools (§8) |
| `csv` | The one copy of the CSV code: the delimited parser, the header table, the script sorter (`splitName`, `splitRosterLine`), the name matcher (`matchKey`, `pairRows`, `mergeRows`), the decoder and the export with its BOM and formula guard |
| `nameNode(student)` | A student's two names as DOM, each script run in its own isolate |
| `openEditor({ classId, opener, host, onClose })`, `closeEditor()`, `isEditorOpen()` | The one roster editor, below |

### The editor

One dialog, opened by an *Edit classes* button in each tool's roster spot: the Dashboard's drawer, the Name
Tags class panel, Flash Cards' profile manager, the reading-assignments class popup.

- **Classes:** list, add, rename, duplicate ("X" → "X 1", the suite's rule), reorder, delete, and *Merge
  into…* for two classes that turned out to be one (§7.4).
- **Students:** a grid of Hebrew name, English name, transliteration and extra line; paste many lines; CSV
  import (Add / New class / Replace) and export; reorder with a grip that also moves by ↑/↓ (pointer events,
  never HTML5 drag-and-drop); delete with Undo; *Restore* for a deleted student.
- **The host's hooks.** `host.autoTranslit(he)`: Name Tags' two schemes need the `hebrew-transliteration`
  library, which only that page's CSP allows, so that page hands the editor the function; where a host gives
  none the column shows only what was typed. `host.mountKeyboard(cfg)`: a page that carries the shared
  `hebrew-keyboard` block hands its `mountHebrewKeyboard`, and the editor then shows a keyboard toggle for its
  Hebrew cells. No page gains a CSP origin.
- **"Used in" chips** per class, read from this device's storage without any request: *Dashboard* (it is the
  live class here, or a preset names it), *Name Tags* (it is the open class here), *Flash Cards (n
  profiles)*, *Reading assignments (linked / not linked)*.
- **Names and direction.** Every name is written with `textContent`. A cell takes the direction of its own
  column (Hebrew right, Latin left, the extra line `dir="auto"`), and wherever a Hebrew name and a Latin one
  share a line — a chip, a menu, the Dashboard's picker — **each run gets its own isolate** (`<bdi>` with
  `lang="he" dir="rtl"` on the Hebrew run), so a Hebrew name beside a Latin one never shows its last mark
  first.
- **Accessibility:** `role="dialog"`, `aria-modal`, labelled by its title; a focus trap heard on the document
  in the capture phase; Escape closes the innermost thing first; focus returns to the opener; the grid is a
  real `<table>` with a caption and labelled inputs; every action is a button; a `forced-colors` block; its
  motion neutralized under `prefers-reduced-motion`; validation inline with `aria-live`, never an `alert()`.
  A page with a capture-phase modal handler of its own (the reading-assignments page) steps aside while
  `isEditorOpen()`.
- **Its CSS** is one `<style>` the file adds when the editor first opens (every carrier's CSP already allows
  inline styles), written with logical properties only. It draws in the suite's palette (navy, gold and cream; the
  hub's dark surfaces under `body.dark`; system colours only in forced colours) and the host page's own font, so it
  reads as part of whichever tool opened it; only the icon buttons (↕ ▲ ▼ ×) keep the system face, which draws those
  glyphs full-size. Its strings are `shared.classes.*`, English and
  Hebrew, re-rendered on a language switch.
- **Untrusted data:** names arrive from other devices and from files. Storage is read with a prototype-safe
  parser and merged without `Object.assign`; nothing reaches `innerHTML`.

## 6. What each tool keeps for itself

Everything below is keyed by `classId` / `studentId`, never by name.

### 6.1 Classroom Dashboard

- `settings.activeRosterId` keeps its field name (per-device, outside the settings row) and holds the **class
  id**. A class that came from a Dashboard roster keeps the roster's id, so the pointer on every device stays
  valid with no rewrite. When that class is gone the first class takes over; with no class at all the picker
  shows an *Add a class* empty state.
- `settings.pickerSessions[classId] = { picked: [studentId], absent: [studentId] }`. A session still holding
  name strings is converted the first time it is read (`idForLine`); a name that is nobody's is dropped (a
  session is per-device and lasts a lesson).
- A preset carries `activeClassId` beside `activeRosterName`: the id is used when that class exists here, the
  name is the fallback when a preset arrives from a file or another teacher.
- `settings.pickerNames` (*Names shown*: both / Hebrew / English) decides what the picker, the groups and the
  fullscreen pop print; "both" shows Hebrew first. A line once typed "David / דָּוִד" is a Hebrew name and an
  English name now.
- The drawer holds the class menu, the student count, *Edit classes*, the link to Name Tags and *Names
  shown*. The roster textarea and its New / Rename / Delete buttons are gone — the editor does all of it.
- `settings.rosters` stays in the blob, read by the live view and written only by the scrub (§7.7).

### 6.2 Name Tags

- The design and print options (`hebrewNameTags_settings`) are unchanged.
- **The student table stays editable where it is**, and every edit is one operation on the shared class
  (`setStudentField`, `addStudent`, `removeStudent` with its Undo, `moveStudent`, the extra-line box →
  `setClassExtra`). The page holds a view of the open class (`ntCur`) that it re-adopts on every change, so a
  row keeps its focus and its Print tick, which keys on the student id and survives a corrected name.
- New / Rename / Duplicate / Delete and the CSV buttons call the operations and `IvritClasses.csv`; *Edit
  classes* opens the editor with the transliteration and keyboard hooks.
- Which class is open is the per-device, erase-only key `hebrewNameTags_activeClass` (a class id). The first
  load maps the old `hebrewNameTags_activeList` name through `idForList`; that old key is left alone.
- **No stored per-tag overrides** — a row's four fields are the student's own, in the class; the Print tick
  is per session by design.
- `?from=dashboard` opens the Dashboard's live class (there is nothing to copy any more).

### 6.3 Flash Cards

- A profile has an optional **`studentId`**. Progress stays in the profile, keyed by the profile's name; a
  profile with no student (a teacher's own, a guest) works as it always has.
- The profile manager has a class filter (per-device, erase-only `hebrewFlashCards_profileClass`), and with a
  class chosen: *Make profiles for this class* (one linked profile per student who has none), *Link
  profiles…* (a suggestion per unlinked profile from the CSV matcher, each one confirmed or skipped — nothing
  is linked silently), whole-class *Progress reports* and *Certificates* (one student after another, a page
  break between), and *Edit classes*.
- A renamed student does not rename the profile (a rename there is a delete and an add in the account); the
  list shows the roster's name beside the profile's when they differ, with *Rename to match*, and *Unlink*.
- A link whose student is no longer on any class list (the class was deleted, or the student removed) counts
  as no link (`fcLiveLink`): the profile shows in *Link profiles…* again and *Make profiles* never makes a
  second profile beside it. The stale id is never cleared by itself — the classes may simply not have arrived
  on the device yet. An *Unlink* can come back when the same profile changed on another device meanwhile (the
  profile merge keeps a field only one copy has).

### 6.4 Reading assignments

- Linking happens only on `reading_assignments.html`, the page that loads `js/ivrit-assignments.js`. That
  module is unchanged and stays the only code that talks to the `classes` / `students` tables (accounts
  rule 2); the link itself is two fields of the shared class, written by `setLink` and `setStudentUsername`.
- The class popup's **Class list** block: a menu of the shared classes. Choosing one stores the account
  class's id as `accountClassId` on it (and clears it on any other — one class list a class). Deleting the
  account class clears the link.
- **Create accounts for these students** puts the linked list's students who have no login into the page's
  own names box and opens its preview — the name shown, the username and the password, all editable — sixty
  at a time (the server's batch). Only the preview's *Create* makes the logins, by the page's existing path
  (`students.create`, then each new student placed in the class); each username that was made is then noted
  on its student. **No account is ever created automatically.**
- A student "has a login" while the account still lists the username noted on it; a login removed on the
  page leaves its student without one again. A student whose login was just made is taken off the filled
  list, so a later preview — a failed row tried again, the same name typed by hand for another child — is
  never handed that student and cannot note its login over the first. When a list is linked, a student whose name exactly one
  unclaimed login of the class already shows gets that login noted.
- The one name an account shows is the student's English name, else the Hebrew one.
- The page's "From a class list on this device" menu reads the shared classes and the Flash Cards profiles.
- The editor's chip only says *linked* or *not linked* (from `accountClassId`); it makes no request.
- **No schema change beyond `0013`.**

### 6.5 Settings, presets, files and links

- Presets and a file's `liveState` carry the class as **id and name**: the id wins when that class exists
  here, the name is the fallback. A file from another teacher therefore still lands on their same-named class.
- A pointer to "the class open on this device" never enters a synced settings row (it would overwrite
  another device's choice — accounts rule 7).
- No `?s=` link carries a class, a student id or a name; `smoke-tools` asserts it on the Flash Cards link.

## 7. Existing data

Three rules carry it: **ids are computed, not minted; old data is read before it is copied; and a copy is
made only once the account has been heard from.**

### 7.1 Computed ids, each old source on its own

| Old source | Class id | Student id |
|---|---|---|
| A Dashboard roster | **the roster's own id** | a short hash of (class id, the exact line) |
| A Name Tags list | `nt_` + a short hash of the list's name (NFC) | a short hash of (class id, the row's name key, which of several identical rows it is) |

- No time stamp is written for migrated data. Two devices holding the same old class therefore produce **the
  same bytes** — the same account row, the same hash, nothing to merge and nothing doubled. If they race, the
  merge is by id and the result is still one class.
- A Dashboard line becomes a student by script: its Hebrew part is the Hebrew name and the rest the English
  name. **A line in one script is kept exactly as typed**, punctuation included ("David K.", "Maya (aide)");
  only a line holding both scripts is divided, at its separator (`/`, `|`, `·`, a free-standing dash).
- An old Dashboard's untouched empty "My class" is not a class and is never copied.
- A list's `extra` becomes the class's; a row's `tr` and `ex` come across as they are.

### 7.2 Read first, copy later

`IvritClasses.list()` returns the stored classes **plus a live view of every old source not yet copied**,
computed with the ids above and never written. So a device that still holds only old data shows every class
in every tool — signed out, offline with a stored session, in a classroom with no internet — without a
single write.

An old source is **copied into the store** (`adopt`) only when:

1. **the account has just been heard from** — `Classes` hydrated successfully in this page load — **and so was
   the old key's own tool** (`Dashboard` for the rosters, `NameTags` for the lists; a page that did not hear a
   tool's rows may be holding a stale copy of them), and the source is not already a class and not in
   `retired`; or
2. **a person changes that class** (that one class is copied, stamped, and changed).

A signed-out device therefore runs on the live view until a class is changed, and its first sign-in card
shows its old lists once, not twice (the classes are made after the card's answer, never offered on it).

### 7.3 Why two devices cannot double a class

| Situation | What happens |
|---|---|
| A and B hold the same roster, both signed in; A loads first | A hears the account (no classes), copies, uploads. B hears the account, the class is already there under the roster's id, B copies nothing |
| A and B load at the same moment, or one was offline | Both produce the same id and the same bytes; whichever uploads second meets an identical row, or merges by id |
| A Dashboard tab and a Name Tags tab open together | Each copies only the old key whose tool it heard; both write through the one store, and the fold gives the same class from either |
| B holds only the roster, A holds the roster and the list | Each source keeps its own id; the fold (§7.4) is a separate step with the same answer on both |
| X holds only the list, Y only the roster | Each copies what it has; when the other's class lands, both fold the two stored classes into the roster-id class (§7.4) and hold the same bytes |
| A deletes a class; C, which never held it, later downloads the old roster | The class id is in `retired`, which lands first; C shows nothing and uploads nothing |
| A session that ended by itself, then offline use | Only the live view is used; nothing is copied, so nothing appears as "this device's own" at the next sign-in |
| The first-sign-in card on a device with old lists | It lists the old lists. *Add* sends them and the classes follow; *Remove* removes them and there is nothing to copy |

### 7.4 One class from a roster and a list (the fold)

A roster and a list are the same class when they have **the same name and the same students, one for one**
(after trimming, NFC, ignoring nikkud, capitals and spacing — the CSV import's matcher: every name both have
agrees and they share at least one). Then the roster-id class is the class: it takes the list's Hebrew names,
transliterations and extra lines wherever its own are blank, records the list's id as its `fold`, and the
list's id goes to `retired` with a fixed stamp (`1`, so every device writes the same bytes and any later edit
of a class outranks it). The rule reads only the two sources, so every device folds the same way; a device
holding only one of the two simply receives the folded class. Nothing is folded into a roster whose class was
deleted, nor into a class that already stands for another list.

**A near-match is never merged silently.** Same name but different students: both stay, and a one-time
notice in the editor names the pair and offers *Merge them*, which a person confirms.

**The two sources need not meet on one device.** After the plain rule above (the two old sources as they were
typed, which a rename in the editor does not undo), `survey` looks at each side as the store knows it now:

- **A list that is already a stored class of its own** (`nt_…`) is folded like any other list. This is the
  teacher who used Name Tags on one device and the Dashboard on another: each device copied the only source it
  had, and each then receives the other's class from the account. The roster side may be an old roster or a
  stored class whose roster this device does not hold (any stored class that is not `nt_…` and has no
  `created` — a class made in the editor is never folded). The list class leaves the store, and what it
  carried goes to the joined class: blank fields, the extra line, a student's noted login, the
  reading-assignments link. A device that still holds the list class's row afterwards keeps a copy in its
  recovery bin, as for any row the account stops listing.
- **A list student whom no student of the roster class answers to may be one that class removed** (`gone`).
  This is the student removed on a device that does not hold the list: the Dashboard's scrub takes the line out
  of the roster, the list still has the row, and the two no longer match one for one. They are still one class;
  the student stays removed, and the list's row is then named by the scrub.

Both give the same class on every device, because each device reads the same stored rows. What still stays
two classes, with the notice: a list holding a student the roster class never had, a roster class holding a
student the list lacks, and a pair whose names differ (a renamed class).

### 7.5 An edit made on an old page

An old tab left open, or a device offline on an old version, still writes the old keys, and those still sync
between old pages. Every `adopt` therefore looks again at each old source that is already a class and takes
**only what the class lacks, add-only, by id first**:

- a line or row whose computed id is already a student changes nothing but that student's blank fields — so
  a student renamed in the editor is not doubled by the old line that still spells the old name;
- one whose computed id is in the class's `gone` list is not added again (deleted here on purpose);
- anything else is matched by name; a match fills blanks, and only a student matching nobody is added, under
  the same computed id on every device;
- a line that disappeared changes nothing.

Because the ids are computed from the old data, this needs no record of what was imported before, and running
it on every load writes nothing once the class holds the line. Signed out, it runs at load for classes
already copied.

Accepted consequences: a name *changed* on an old page arrives as an added student beside the old one; and
once a list has been folded into its roster (§7.4) its id is retired, so later edits made to that **list** on
an old page are no longer imported — the roster's are.

### 7.6 The per-device memory

`ivritSuite_classesLegacy` — per device, erase-only, never exported or synced — holds only which near-match
notices were answered with *Keep both*: `{ "v": 1, "told": { "<idA>|<idB>": 1 } }`.

### 7.7 The delete-only scrub

A deleted student's name must really leave the account, including the old rows that still hold it. So the
page that owns an old key — the Dashboard for its rosters, Name Tags for its lists — removes the old source
of a deleted class and the line or row of a deleted student, through its own save path. This is the only
write to an old key, and it only ever removes.

- `IvritClasses.scrub('dash' | 'nt')` answers `{ sources, lines, rows }`: the old sources whose class was
  deleted (a fold's fixed stamp is not a deletion), the roster lines whose computed student id is in the
  class's `gone` list, and the list rows likewise, each named by its index in the stored list (a stored list
  may hold entries that are not rows). For a list folded into a roster class (`fold`) the rows are matched by
  name: rows a student still in the class answers to stay, and of the rest the ones a removed student answers
  to go.
- `IvritClasses.watchScrub(from, tool, fn)` calls the page's remover whenever the plan names something.
  Signed out, at once and after every change. With a stored session, only once a hydration in this page load
  has answered for `Classes` **and** for the old key's own tool, so a stale copy is never the one acted on.
- The Dashboard's remover edits `settings.rosters` (and that class's pick session) and saves the blob; Name
  Tags' rewrites `hebrewNameTags_lists`. The account rows follow through the ordinary write-through. A second
  Dashboard tab takes the store's `rosters` on the blob's `storage` event — it saves the whole blob from
  memory, so its own copy would otherwise put a scrubbed roster back.

Until the owning page is next opened on some device, the old row still holds the name. The delete confirm
does not promise otherwise. Deleting a class can leave up to three recovery-bin copies on another device (the
class, its old roster, its old list).

### 7.8 What is never done

- An old key is never deleted or rewritten by the copy step.
- Flash Cards profiles are never linked or renamed by themselves (§6.3).
- Nothing is merged that a person did not ask for, except the exact fold of §7.4.

## 8. Files and older versions

- **Where the classes ride:** the hub's `exportAllSettings`, `importAllSettings`, `eraseAllSettings` and the
  AllTools `IVRIT_CFG.gather` / `apply`, and the Dashboard's, Name Tags' and Flash Cards' own `IVRIT_CFG`,
  carry the bundle key `classes` (`exportAll()`: the stored classes and the live view together, so a
  signed-out teacher's backup holds every class). `ivritSuite_classesLegacy`, `hebrewNameTags_activeClass`
  and `hebrewFlashCards_profileClass` are erase-only.
- **An old `.ivrit` or AllTools file** carrying `dashboardRosters`, `dashboardSettings.rosters` or
  `nameTagLists` imports into the store through the same reader with the same computed ids — so importing a
  file twice, or on two devices, makes each class once. Those sections go **only** through
  `IvritClasses.importFile`; no import writes them into the old keys. `flashCardProfiles` import as before
  (after the classes, so a profile's link finds its student).
- **A file may carry both generations.** On import, an old section is read only for a source that no class
  in the file already stands for: a class's own id, the old list named by its `fold`, and every id in the
  file's record of deleted classes — which sits inside `classes` in a file a page wrote and is a section of
  its own, `classesRetired`, in an account backup. Where the file's class ends up stored, its fold is recorded
  here too, so the list is not taken for a second class when the account's old row lands later. (Without
  these, restoring a backup doubled a folded class and brought a deleted class back from its old roster.)
- **A restore is a deliberate act, whatever the file:** a student in the file who is in `gone` here comes
  back (the same student, by id), and a class in `retired` comes back, both stamped now. That is why a file
  import is its own function and not `mergeClass`. Students are matched by id, then by name; nothing typed is
  replaced — a backup is older than what it is restored over.
- **Merge / fill / Replace:** a Merge and a `partial` file (an account backup, `fill`) land the same way —
  they add classes and students, fill blanks and bring back what was deleted; **only an AllTools Replace
  replaces the class store** (and takes the file's record of deleted classes with it). A tool page's own
  Replace merges the classes (it replaces that tool's settings, not a store four tools share). Signed in,
  Merge stays the only choice, as everywhere. A file that adds nothing to what the device already shows
  writes nothing.
- **The old registry rows.** `Dashboard`/`roster` and `NameTags`/`list` stay registered: sign-out still
  removes those keys, an account never opened on a current page still reaches a new device, old tabs still
  sync with each other, and the scrub's removals travel. They can be dropped from the registry later, on the
  maintainer's word, once no supported page writes them; their account rows are then left in place (no
  statement deletes rows) and ride an account backup under `cloudUnknown`. The old-file reader stays for good.

## 9. Privacy and legal text

`privacy.legal.collect` and `privacy.legal.ferpa_norecords` (English and Hebrew) state what a class list in
an account holds: each student's name in Hebrew and English, a pronunciation and an extra line when the
teacher types one, a Flash Cards profile's link to a student, and — once a class is linked to reading
assignments — that student's username. `privacy.legal.ferpa_parental` already says a deleted item can remain
on another device until dismissed and that a device which changed it since re-adds it, which covers §7.7.
`terms.legal.outputs` ("class rosters … are yours") covers the rest. Both privacy blocks are
`data-legal-block`s with counted segments (`check-i18n` Check E).

## 10. Who is in scope

| Page | Holds student names? | Uses the shared classes |
|---|---|---|
| Classroom Dashboard, Name Tags, Flash Cards | Yes | Yes |
| `reading_assignments.html` | The link and the import menu; the accounts are in the database | Yes. The Torah Trainer's Teacher tab only reads account classes and is unchanged |
| The hub (`index.html`) | Only as the backup's carrier | Yes — AllTools and the account hooks |
| Worksheet generator | No. A Class Set is a number of versions; the Name/Date line is blank | No. "Each child's name on their Class Set version" is a logged idea this store would make small |
| Parsha Emojis, Holiday Guide | No. The name line is a blank line | No — same note |
| Trope Tutor | No | No. "Per-child mastery" is a logged idea |
| Font Maker | Only the author's own name | No |
| `letter_discrimination.html` | No. The participant code is held in memory and written only to the CSV | No |
| Letter Learner, Dictionary, Torah Trainer, Trope Atlas | No | No |

Two per-device keys can hold copies of student names: the recovery bin and the kept settings copies.

## 11. How it is proved

- **`node scripts/smoke-classes.mjs`** (Node; the file loaded once per "device" with its own storage and
  clock): merging a copy with itself changes nothing; `merge(a, b)` and `merge(b, a)` are the same bytes; three
  devices in any order agree; a deletion beats unstamped data and a later edit beats a deletion; a stamped
  clear wins; unknown fields and hostile ids survive; reading writes nothing; two devices copying the same old
  data write the same bytes and copying twice changes nothing; a rosters-only copy merges into the folded one;
  an old page's added line arrives once, and a deletion or a rename made here holds; a deleted class is never
  re-created, and a landed copy of one is removed only by the prune (a class edited since its deletion is kept);
  two devices that each held one old source end with one class and the same bytes, and a student removed before
  the list was seen stays removed in one class; deleting a class whose fold is only a view takes the list with it; a backup from such a device, and an account
  backup, restore each class once; a move stamps no class as edited; Replace and Merge into keep ids and logins; files import once, restore what was deleted and replace nothing typed; a near-match is never
  folded; the scrub names exactly the deleted sources, lines and rows; the CSV code round-trips.
- **`scripts/smoke-migration.mjs`** (the golden replay, `--sdk` required). Along its main story the old
  rosters and lists go up as one class each — never offered on the first-sign-in card, no time stamp — and
  device A, device B and the account hold the same classes; a class deleted through the operation takes its
  class row and its scrubbed old roster row out of the account; a restore brings it back without writing the
  old key. Step 12 then runs, on accounts of their own: a roster and a list that are one class go up as ONE
  and a rosters-only device sends nothing; two devices offline with a stored session show their class and
  write nothing, then come online at once — one row, and four more loads send nothing; a class deleted on one
  device is gone on the other (a copy in its recovery bin) and a fresh device does not make it again from the
  old roster; a removed student is restored by the account backup, once; a name added by an old Dashboard
  page (a raw write of the old key) arrives as exactly one student and the next load sends nothing; a class
  changed on two devices merges on the hub with no dialog; a button sign-out removes the classes; and while
  the account refuses the tool (`23514`) the class stays whole and goes up once it is accepted.
- **`scripts/smoke-sync.mjs`**: an old tab is simulated by writing `settings.rosters` the way an old page
  did; and a Dashboard tab and a Name Tags tab open together on an account holding a roster, its same-named
  list and another list show the same classes, send each once, pass a new student from one to the other with
  no old key written, and keep a deleted class deleted — its row, the old roster and the old list — across a
  reload of both.
- **`scripts/smoke-tools.mjs`**: Name Tags on the shared classes; the Flash Cards share code holds no class,
  student or profile.
- **`scripts/smoke-assignments.mjs`** (scenario N): linking writes only the link; *Create accounts…* only
  fills the preview; the logins are made by *Create* and each username noted; a removed login and an added
  student are offered again; relinking moves the link and notes an existing same-named login; the editor
  opens above the popup and Escape closes only it. `test-rls-assignments` runs unchanged (no policy changed).
- The editor and each page's wiring are checked in a browser: light and dark, 1280 and 800 px, English and
  Hebrew, zero page errors, measured contrast, the focus trap, Escape closing the innermost thing first, focus
  back to the opener, a landing while a cell holds unsaved text, a language switch while open, old data
  seeded first and the old keys compared afterwards.

## 12. Settled with the maintainer

| Point | Decision |
|---|---|
| A deleted student | *Restore* from the class's own `gone` list; no recovery-bin copy. A deleted **class** goes through the bin |
| A `note` field | Left out (§3) |
| Per-tag overrides in Name Tags | None; the Print tick stays per session and follows the student id (§6.2) |
| Name Tags' student table | Stays editable where it is, each edit saved into the shared class (§6.2) |
| Removing a deleted name from the old account rows | On the owning page's next open — the Dashboard for a roster, Name Tags for a list (§7.7) |
| Joining a roster and a list automatically | Same name and the same students one for one (§7.4) — also when each device held only one of the two, and when the only difference is a student the roster class removed; anything else is a notice and a confirmed merge |
| Names on the Dashboard | A *Names shown* setting: Hebrew, English or both; the default is both, Hebrew first (§6.1) |
| Flash Cards | *Make profiles for this class* beside linking existing profiles; nothing linked silently (§6.3) |
| Reading-assignment accounts | Never created automatically; the preview is the confirmation (§6.4) |
