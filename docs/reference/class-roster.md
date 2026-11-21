# The shared class roster (`ivritSuite_classes`) — DRAFT, awaiting approval

> **Status: a design, not yet built.** Nothing described here exists in the code. Phase 1 starts only after
> the maintainer approves this file on its pull request; it is then rewritten in the present tense as the
> reference for the finished system. Binding rules live in `CLAUDE.md`; keep this file free of session ids,
> dates, digests and line numbers.

One class and its students, entered once and used by the Classroom Dashboard, Name Tags, Flash Cards and
the Torah Trainer's reading assignments. Modeled on the suite-wide word lists (`ivritSuite_wordLists`).

## 1. Decisions already taken

| Question | Decision | Why |
|---|---|---|
| Where the shared code lives | One file, `js/ivrit-classes.js` (data, the editor and its CSS), loaded by each carrier and precached — not a pasted `═══` block | One copy of the code that handles student names; Node can load it for the migration tests; no sha check across five carriers. The repo already ships shared engines this way (`js/trope-staff.js`, `js/coloring-art.js`) |
| Which account tool the rows sync under | A new tool value, `Classes` | `Suite` is skipped by the sign-out removal on purpose, so student names would stay on a shared device; an existing tool's kinds would reach other pages' re-read hooks under names they already use (`settings`). Costs migration `0013` (accounts rule 7) |
| Mirrors of the old keys | None. New pages never write `hebrewDashboard_settings.rosters` or `hebrewNameTags_lists`, except to remove what a teacher deleted (§7.7) | Writing them doubles classes in two measured ways: the Dashboard saves its whole settings blob from memory, so an open Dashboard tab overwrites a mirror another page wrote and uploads the stale class; and Name Tags lists sync as keep-both items, so two devices' mirrors meeting in the account make a "(from another device)" list |
| An edit made on an old cached page | Imported, add-only: new students added, blanks filled, nothing removed or replaced (§7.6) | Nothing typed on an old page is lost. Accepted cost: a student deleted on a new page can come back if an old page still lists them |

## 2. Where the code differs from the brief

The code wins; these shaped the design.

- A Dashboard class is `rosters[id] = { name, names }` where `names` is an **array of one-line strings** — a
  student is one free-text line, never split into Hebrew and English. `pickerSessions[id] = { picked, absent }`
  hold those **name strings**. A preset carries the class **name** (`activeRosterName`), never an id.
- `ivritSuite_wordLists` syncs under the tool **`Dictionary`**; Flash Cards and the generator reach it with
  `alsoPull: ['Dictionary']`. It is not a `Suite` row.
- Name Tags lists are keyed by **list name** (sync shape `map`, merge `item`, which keeps both copies on a
  conflict). A list also has one `extra` line for the whole class, which the brief's shape left out.
- A Flash Cards profile also carries `ladder`.
- `reading_assignments.html` is already a **fourth reader** of all three stores (its "From a class list on
  this device" menu).
- Neither the Dashboard nor Name Tags has a `?s=` link. Flash Cards' link carries its settings only, and its
  settings have no profile field — so no share link carries a student's name today, and none will.
- An account student has **one** display name, which the teacher cannot change after the account is made;
  creating accounts takes no class (the page sets each new student's class afterwards).
- There is no shared dialog or focus-trap code; each page has its own.

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
| `he` / `en` | The two names Name Tags already keeps; a Dashboard line is sorted into them by script (§7.1) |
| `tr` | A transliteration typed by hand. The automatic one is computed where it prints and is never stored, so it cannot differ between devices |
| `ex` | **Name Tags' per-student extra line**: it replaces the class's `extra` for that one student. This is what the brief's `ex` maps to |
| `username` | Present only once the student is linked to a reading-assignments login (§6.4) |
| `t` (on a student or a class) | The time each field was last edited by a person, only for fields edited after creation. It is what lets "the later edit wins" hold field by field |
| `gone` | Deleted students: the time, and the two names so the editor can offer **Restore**. Without it a merge of two devices' copies would bring a deleted student back. Capped at the newest 400 per class, never dropped by age (an old backup or a device unused for a year would otherwise resurrect every student deleted long ago) |
| `retired` | Deleted classes, by id. Without it a class deleted on one device is re-created on another from that device's old roster (§7) |
| `accountClassId` | Present only once the class is linked to a reading-assignments class |

**Left out on purpose: `note`.** No tool reads it, and free text about a child in an account is a new kind
of data under accounts rule 8. Unknown fields survive every merge and import, so it can be added later
without a migration.

**Limits:** 40 classes, 200 students a class, 120 characters a field or class name (Name Tags' existing
caps; the Dashboard's picker keeps its own 60 for what it shows at once). A refusal is an inline note.

**Nothing is written on load.** The Dashboard stops minting an empty "My class"; an empty state offers
*Add a class* instead. So no seed can ever reach an account, and the registry needs no `skipUpload`.

**Time stamps** come from `max(Date.now(), the highest stamp already in the class + 1)`, so a device with a
slow clock can still make an edit that counts as later than what it is editing.

## 4. The account rows

Two rows in `IVRIT_SYNC_REGISTRY`, both under the new tool `Classes`, which goes **before** `Dashboard` in
`var TOOLS` (a hydration runs in that order, so the classes land before the old rosters are looked at):

```js
{ tool: 'Classes', kind: 'class', lsKey: 'ivritSuite_classes', shape: 'mapIn', path: 'classes', nameField: 'name',
  envelope: { v: 1 }, merge: 'page', ivritKey: 'classes', label: 'shared.cloud.kind_roster' },
{ tool: 'Classes', kind: 'retired', lsKey: 'ivritSuite_classes', shape: 'single', merge: 'deepMax', omit: ['classes'],
  ivritKey: 'classesRetired', label: 'shared.cloud.kind_class_removed' }
```

Two entries on one key is the Dashboard's own pattern (its settings row omits the rosters its roster rows
carry). The `retired` row uses the module's built-in `deepMax`, so every page — the hub included — can
resolve it with no page code.

- **One row per class**, named by the class id, labelled by its name.
- **A new `saves.tool` value needs a migration** (accounts rule 7):
  `db/migrations/0013_saves_tool_classes.sql`, the same one-constraint swap as `0004`, `0005` and `0007`.
  It is in this pull request with `Live? = no` and **is not applied**. It must be applied **before** the
  feature reaches `main`: until then the server answers every class upload with `23514`, the status line can
  only say "limit of saved items", and the rows never get a sync memory.
- **Every roster page** adds `alsoPull: ['Classes']`, `merges: { class: IvritClasses.mergeClass }` and an
  `onLocalChanged` branch for `class` / `retired` that tells the module to re-read. The hub passes the merge
  too, so a conflict it meets is resolved there rather than left.
- **Changes to `js/ivrit-saves.js`:** `TOOLS`, `TOOL_NAMES`, the two rows, and one behavior: a tool reached
  through `alsoPull` also takes the attaching page's `editing` hook (today it takes `merges`,
  `onLocalChanged`, `paused` and `hydrate`), so a class landing from another tab waits while the editor has a
  cell focused. Nothing else in the module changes.

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
- **Order:** the copy with the later `t.order` gives the order; students only the other copy has are
  appended.
- **`created`** is the earlier, **`updated`** the later; **unknown fields** survive.

### Deletions

- **A class deleted in the editor** is removed from `classes` and its id is written to `retired`. The row
  leaves the account like any deleted item; another device that still holds it keeps a copy in its recovery
  bin (`ivritSuite_removedByAccount`), offered for download until dismissed — the existing behavior, with
  no new code. The confirm names the account-wide effect while a session is stored
  (`IvritAccount.hasStoredSession()`).
- **A class is shown only if** it is not in `retired`, or it was edited after it was retired (a device that
  changed it since re-adds it — again the existing rule).
- **A deleted student** is kept in the class's own `gone` list with the two names, and the editor offers
  *Restore* there. **This is instead of the recovery bin** — see open point 1.
- **A landing never rewrites the row that landed.** Nothing clock-based or version-based runs in the
  re-read path, or every page load on every device would send one write, forever.

## 5. Who writes the store: `js/ivrit-classes.js`

**Only this file writes `ivritSuite_classes`.** A tool page never does. It talks to no server (accounts
rule 2 is untouched) and exposes `window.IvritClasses`:

| Part | What it does |
|---|---|
| `list()`, `get(id)`, `onChange(fn)` | What every tool reads. `list()` returns the stored classes plus the not-yet-migrated old ones (§7.2). `onChange` fires on this page's writes, on another tab's (`storage`), and when the page's `onLocalChanged` forwards a landing |
| Operations (`addClass`, `renameClass`, `setStudentField`, `removeStudent`, `moveStudent`, `setLink`, …) | **Each one re-reads the store, applies one stamped change, and writes.** Nothing holds a whole class in memory and writes it back, so a class another tab or device just sent is never overwritten |
| `mergeClass` | §4 |
| The legacy reader | Migration, the fold, the ledger and the delete-only scrub (§7) |
| `importFile(data, mode)`, `exportAll()` | `.ivrit` and AllTools (§8) |
| The CSV code | Name Tags' parser, header table, script sorter, name matcher and add-by-name merge, **moved here unchanged** (`ntParseDelimited`, `NT_HEADERS`, `ntImportRows`, `ntSplitName`, `ntMatchKey`, `ntMergeRows`, the export with its BOM and formula guard); Name Tags then calls them here |
| `openEditor({ classId, opener, host })` | The one roster editor, below |

### The editor

One dialog, opened from each tool's existing roster spot: the Dashboard's class picker, the Name Tags class
panel, Flash Cards' profile manager.

- **Classes:** list, add, rename, duplicate ("X" → "X 1", the suite's rule), reorder, delete, and *Merge
  into…* for two classes that turned out to be one (§7.4).
- **Students:** a grid of Hebrew name, English name, transliteration and extra line; paste many lines; CSV
  import (Add / New class / Replace) and export; reorder with a grip that also moves by ↑/↓ (pointer events,
  never HTML5 drag-and-drop, as Name Tags does now); delete with Undo; *Restore* for a deleted student.
- **The transliteration column** stores only what is typed. Name Tags' two schemes need the
  `hebrew-transliteration` library, which only that page's CSP allows; the page hands the editor a
  `host.autoTranslit(he)` hook, and where a host gives none the column simply shows what was typed. No page
  gains a CSP origin.
- **"Used in" chips** per class, read from this device's storage without any request: *Dashboard* (it is the
  live class here, or a preset names it), *Name Tags* (it is the open class here), *Flash Cards (n
  profiles)*, *Reading assignments (linked / not linked)*.
- **Names and direction.** Every name is written with `textContent`. A cell takes the direction of its own
  column (Hebrew right, Latin left, the extra line `dir="auto"`), and wherever a Hebrew name and a Latin one
  share a line — a chip, a menu, the Dashboard's picker — **each run gets its own isolate** (`<bdi>` with
  `lang="he" dir="rtl"` on the Hebrew run). That closes the Dashboard's open item where "דָּוִד / David K."
  shows its last mark first.
- **Accessibility:** `role="dialog"`, `aria-modal`, labelled by its title; a focus trap heard on the document
  in the capture phase (the `.ivrit` prompt's proven pattern); Escape closes the innermost thing first; focus
  returns to the opener; the grid is a real `<table>` with a caption and labelled inputs; every action is a
  button; a `forced-colors` block; its motion neutralized under `prefers-reduced-motion`; validation inline
  with `aria-live`, never an `alert()`.
- **Its CSS** is one `<style>` the file adds when the editor first opens (every carrier's CSP already allows
  inline styles), written with logical properties only. Its strings are `shared.classes.*`, English and
  Hebrew, re-rendered on a language switch.
- **Untrusted data:** names arrive from other devices and from files. Storage is read with a prototype-safe
  parser and merged without `Object.assign`; nothing reaches `innerHTML`.

## 6. What each tool keeps for itself

Everything below is keyed by `classId` / `studentId`, never by name.

### 6.1 Classroom Dashboard

- `settings.activeRosterId` keeps its field name (it is already per-device and outside the settings row)
  and holds the **class id**. A class migrated from a Dashboard roster keeps the roster's id, so the pointer
  on every device stays valid with no rewrite.
- `settings.pickerSessions[classId] = { picked: [studentId], absent: [studentId] }`. A session still holding
  name strings is converted the first time it is read, by matching each name to a student of that class; a
  name that matches nobody is dropped (a session is per-device and lasts a lesson).
- A preset gains `activeClassId` beside `activeRosterName`: the id is used on this account, the name is the
  fallback when a preset arrives from a file or another teacher.
- A new setting, *Names shown* (Hebrew / English / both), decides what the picker, the groups and the
  fullscreen pop print. **A visible change:** a line typed "David / דָּוִד" becomes a Hebrew name and an
  English name, and "both" shows them in one fixed order.
- The *Make a class from a Name Tags list* box and its link are removed; *Edit classes* opens the editor.
- `settings.rosters` stays in the blob untouched, read-only (§7).

### 6.2 Name Tags

- The design and print options (`hebrewNameTags_settings`) are unchanged.
- The class panel becomes **Class: [menu] [Edit class]**, with the student table as the print list: the
  per-student Print tick now keys on the student id, so it survives a name being corrected.
- Which class is open is a new per-device, erase-only key, `hebrewNameTags_activeClass` (a class id). The
  old `hebrewNameTags_activeList` is left alone.
- **No stored per-tag overrides in this version** — none exist today (a row's four fields are the student's
  own, now in the class; the Print tick is per session by design). See open point 3.
- CSV import and *From the Classroom Dashboard* are replaced by the editor's import; a CSV goes into the
  shared class.

### 6.3 Flash Cards

- A profile gains an optional **`studentId`**. Progress stays in the profile, keyed by the profile's name as
  now; a profile with no student (a teacher's own, a guest) works exactly as today.
- *Link profiles to a class* suggests a student for each unlinked profile by name (the same matcher the CSV
  import uses) and the teacher confirms or skips each one. Nothing is linked silently.
- A renamed student does not rename the profile (a rename there is a delete and an add in the account); the
  list shows the roster's name beside the profile's when they differ, with *Rename to match*.
- The profile list gets a class filter, and the progress report and the certificate can print a whole class
  (one student after another, a page break between).

### 6.4 Reading assignments

- Linking happens only on `reading_assignments.html`, the page that already loads
  `js/ivrit-assignments.js`. No other page loads that module, and it stays the only code that talks to the
  `classes` / `students` tables (accounts rule 2).
- The class popup gains **Link to a class list** (a menu of the shared classes). It stores the account
  class's id as `accountClassId` on the shared class.
- **Create accounts for these students** lists the linked class's students who have no `username` yet and
  feeds them into the page's existing path, unchanged: the editable preview (the name shown, the username,
  the password), then *Create … accounts*, then each new student placed in the class. The preview is the
  confirmation, as it is today; the 60-a-call and 200-a-teacher limits apply. Each username made is then
  written to its student. **No account is ever created automatically.**
- The one name an account shows is the student's English name, else the Hebrew one — what the page's
  existing import already takes.
- The page's "From a class list on this device" menu reads the shared classes instead of the three old keys.
- The editor's chip only says *linked* or *not linked* (from `accountClassId`), with a link to the page; it
  makes no request.
- **No schema change beyond `0013`.**

### 6.5 Settings, presets, files and links

- `getSettings()` / `applySettings()` and presets carry the class as **id and name** (`{ id, name }`): the
  id wins when that class exists here, the name is the fallback. A file from another teacher therefore still
  lands on their same-named class.
- A pointer to "the class open on this device" never enters a synced settings row (it would overwrite
  another device's choice — accounts rule 7); it rides only in presets and in a `.ivrit` file's `liveState`.
- No `?s=` link carries a class, a student id or a name. The Flash Cards link is asserted in a smoke.

## 7. Existing data

The riskiest part. Three rules carry it: **ids are computed, not minted; old data is read before it is
copied; and a copy is made only once the account has been heard from.**

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
- The Dashboard's untouched empty "My class" is not a class and is never migrated.
- A list's `extra` becomes the class's; a row's `tr` and `ex` come across as they are.

### 7.2 Read first, copy later

`IvritClasses.list()` returns the stored classes **plus a live view of every old source not yet copied**,
computed with the ids above and never written. So the day the update arrives, every tool shows every class —
signed out, offline with a stored session, in a classroom with no internet — without a single write.

An old source is **copied into the store** only when:

1. **the account has just been heard from** — `Classes` hydrated successfully in this page load — and the
   source is not already a class there and not in `retired`; or
2. **a person edits that class** in the editor (that one class is copied, stamped, and edited).

A signed-out device therefore runs on the live view until a class is edited, and its first sign-in card
shows its old lists once, not twice.

*A change from the approved plan:* the plan also copied at load on a signed-out device and needed a new
`IvritSaves.remembers()` to tell the device's own lists from an account's cached ones. The live view makes
that copy unnecessary, so neither exists.

### 7.3 Why two devices cannot double a class

| Situation | What happens |
|---|---|
| A and B hold the same roster, both signed in; A loads first | A hears the account (no classes), copies, uploads. B hears the account, the class is already there under the roster's id, B copies nothing |
| A and B load at the same moment, or one was offline | Both produce the same id and the same bytes; whichever uploads second meets an identical row, or merges by id |
| B holds only the roster, A holds the roster and the list | Each source keeps its own id; the fold (§7.4) is a separate step with the same answer on both |
| A deletes a class; C, which never held it, later downloads the old roster | The class id is in `retired`, which lands first; C shows nothing and uploads nothing |
| A session that ended by itself, then offline use | Only the live view is used; nothing is copied, so nothing appears as "this device's own" at the next sign-in |
| The first-sign-in card on a device with old lists | It lists the old lists (as today). *Add* sends them and the classes follow; *Remove* removes them and there is nothing to copy |

### 7.4 One class from a roster and a list (the fold)

A roster and a list are the same class when they have **the same name and the same students, one for one**
(after trimming, NFC, ignoring nikkud, capitals and spacing — the CSV import's matcher: every name both have
agrees and they share at least one). Then the roster-id class is the class: it takes the list's Hebrew names,
transliterations and extra lines wherever its own are blank, and the list's id goes to `retired` with a fixed
stamp. The rule reads only the two sources, so every device folds the same way; a device holding only one of
the two simply receives the folded class.

**A near-match is never merged silently.** Same name but different students: both stay, and a one-time
notice in the editor names the pair and offers *Merge into…*, which a person confirms.

### 7.5 The ledger

`ivritSuite_classesLegacy` — per device, erase-only, never exported or synced:

```jsonc
{ "v": 1, "seen": { "dash/<rosterId>": { "lines": { "<exact line>": "<studentId>" } },
                    "nt/<list name>":  { "rows":  { "<row key>#<n>": "<studentId>" } } },
  "told": { "<idA>|<idB>": 1 } }          // near-match notices already shown
```

It records, for each old source, exactly what was last taken from it. It is the base every later comparison
is made against — the old text is **never re-parsed and re-matched** against the class, which is what would
turn "David K." into a second student.

### 7.6 An edit made on an old page

An old tab left open, or a device offline on the old version, still writes the old keys, and those still
sync between old pages. A new page that finds an old source differing from its ledger imports **only the
difference, add-only**: a line or row the ledger has not seen is matched against the class by name; a match
fills blanks, no match adds a student with a computed id; a line that disappeared changes nothing. Then the
ledger is updated.

Accepted consequences: a name *changed* on an old page arrives as an added student beside the old one, and a
student deleted on a new page returns if an old page still lists them.

### 7.7 The delete-only scrub

A deleted student's name must really leave the account, including the old rows that still hold it. So on the
page that owns an old key — the Dashboard for its rosters, Name Tags for its lists — the old source of a
retired class and the line of a deleted student are removed, through that page's own save path. This is the
only write new code makes to an old key, and it only ever removes.

Until that page is next opened on some device, the old row still holds the name. The delete confirm does not
promise otherwise.

### 7.8 What is never done

- An old key is never deleted or rewritten by migration.
- Flash Cards profiles are left exactly as they are, unlinked (§6.3).
- Nothing is merged that a person did not ask for, except the exact fold of §7.4.

## 8. Files and older versions

- **A file's `tool` mapping:** the hub's `exportAllSettings`, `importAllSettings`, `eraseAllSettings` and the
  AllTools `IVRIT_CFG.gather` / `apply` register `ivritSuite_classes` under the bundle key `classes`
  (`exportAll()`: the stored classes and the live view together, so a signed-out teacher's backup holds
  every class). Each roster page's own `IVRIT_CFG` carries the same key. `ivritSuite_classesLegacy` and
  `hebrewNameTags_activeClass` are erase-only.
- **An old `.ivrit` or AllTools file** carrying `dashboardRosters`, `dashboardSettings.rosters` or
  `nameTagLists` still imports, **straight into the new store**, through the same reader with the same
  computed ids — so importing a file twice, or on two devices, makes each class once. `flashCardProfiles`
  import exactly as now.
- **A file from this version carries both generations** (the old keys are still on the device). On import,
  an old section is read only for a source that no class in the file or on the device already stands for.
- **A restore is a deliberate act:** a student in the file who is in `gone` here comes back, and a class in
  `retired` comes back, both stamped now. That is why a file import is its own function and not `mergeClass`.
- **Merge / Replace / fill:** a Merge adds classes and students and fills blanks; a `partial` file (an
  account backup) only fills what is missing; **only an AllTools Replace replaces the class store** — a
  single tool's file never wipes classes it did not contain. Signed in, Merge stays the only choice, as
  everywhere.
- **Retiring the old rows.** The registry rows `Dashboard`/`roster` and `NameTags`/`list` stay as they are in
  this release: sign-out still removes those keys, an account never opened on the new version still reaches
  a new device, and old tabs still sync with each other. They can be dropped from the registry in a later
  release, on the maintainer's word, once no supported page writes them; their account rows are then left in
  place (no statement deletes rows) and ride an account backup under `cloudUnknown`. The old-file reader
  stays for good.

## 9. Privacy and legal text

A class list in an account is already stated. Three things are new and are named in the same commit that
adds the registry rows (accounts rule 8): the transliteration and the extra line as part of a class list, a
profile's link to a student, and a linked student's username inside the teacher's saves.

**`privacy.legal.collect`** — replace the clause

> student names and practice results from Flash Cards, and class lists (student names, in Hebrew and English) from the Classroom Dashboard and other tools.

with

> student names and practice results from Flash Cards (and, when you link a profile to a student on a class list, that link), and class lists shared by the Classroom Dashboard, Name Tags, Flash Cards and reading assignments (each student's name in Hebrew and English, a pronunciation and an extra line such as a room or grade when you type one, and — when you link a class to reading assignments — that student's username).

Hebrew, replacing «שמות תלמידים ותוצאות תרגול מכרטיסי הזיכרון, ורשימות כיתה (שמות תלמידים, בעברית ובאנגלית) מלוח המחוונים לכיתה ומכלים אחרים.»:

> שמות תלמידים ותוצאות תרגול מכרטיסי הזיכרון (וכאשר אתם מקשרים פרופיל לתלמיד ברשימת כיתה — גם הקישור הזה), ורשימות כיתה המשותפות ללוח המחוונים לכיתה, לתגי השם, לכרטיסי הזיכרון ולמשימות הקריאה (שם כל תלמיד בעברית ובאנגלית, תעתיק ושורה נוספת כגון חדר או כיתה אם הקלדתם אותם, וכאשר אתם מקשרים כיתה למשימות קריאה — גם שם המשתמש של התלמיד).

**`privacy.legal.ferpa_norecords`** — replace

> or a class list (student names, in Hebrew and English) from the Classroom Dashboard or another tool.

with

> or a class list (student names in Hebrew and English, with a pronunciation, an extra line and a reading-assignments username where the teacher added them) shared by the Classroom Dashboard, Name Tags, Flash Cards and reading assignments.

Hebrew, replacing «או רשימת כיתה (שמות תלמידים, בעברית ובאנגלית) מלוח המחוונים לכיתה או מכלי אחר.»:

> או רשימת כיתה (שמות תלמידים בעברית ובאנגלית, עם תעתיק, שורה נוספת ושם משתמש למשימות קריאה אם המורה הוסיפ/ה אותם) המשותפת ללוח המחוונים לכיתה, לתגי השם, לכרטיסי הזיכרון ולמשימות הקריאה.

`privacy.legal.ferpa_parental` already says a deleted item can remain on another device until dismissed and
that a device which changed it since re-adds it; §7.7 adds nothing it does not already cover.
`terms.legal.outputs` ("class rosters … are yours") needs no change. `check-i18n` Check E is read after the
edit, since both blocks are `data-legal-block`s with counted segments.

## 10. Who is in scope

| Page | Holds student names? | In scope |
|---|---|---|
| Classroom Dashboard, Name Tags, Flash Cards | Yes | Yes |
| `reading_assignments.html` (and the Torah Trainer's Teacher tab, which only reads account classes) | Reads the three old keys for its import menu; the accounts are in the database | Yes — the link and the import menu; the Trainer itself is unchanged |
| The hub (`index.html`) | Only as the backup's carrier | Yes — AllTools and the account hooks |
| Worksheet generator | No. A Class Set is a number of versions; the Name/Date line is blank | No. "Each child's name on their Class Set version" is a logged idea this store would make small |
| Parsha Emojis, Holiday Guide | No. The name line is a blank line | No — same note |
| Trope Tutor | No | No. "Per-child mastery" is a logged idea |
| Font Maker | Only the author's own name | No |
| `letter_discrimination.html` | No. The participant code is held in memory and written only to the CSV | No, as the maintainer's default |
| Letter Learner, Dictionary, Torah Trainer, Trope Atlas | No | No |

Two per-device keys can hold copies of student names and already do: the recovery bin and the kept settings
copies. They are unchanged.

## 11. How it is proved

- **`scripts/smoke-classes.mjs`** (Node, loads the file directly): merging a copy with itself changes
  nothing; `merge(a, b)` and `merge(b, a)` are the same bytes; three devices in any order agree; a deletion
  beats unstamped data and a later edit beats a deletion; a stamped clear wins; unknown fields survive;
  migrating twice gives the same bytes; "David K." imports once; a near-match is never folded.
- **`scripts/smoke-migration.mjs`** (the golden replay), extended. Its device A already holds old rosters and
  lists; `Classes` joins `EXPECTED_ROWS`, the tool list and the page map. New steps:
  - a device holding only the rosters: nothing doubled;
  - two devices, both offline, each on the live view, then both sign in: one class each, same bytes on A, B
    and the account;
  - A deletes a class; a fresh C never shows it and sends nothing for it;
  - A deletes a student; the earlier backup restores her;
  - a context served the **old** page adds one roster line: exactly one student arrives, and the next load
    writes nothing;
  - **a reload round A, B, A, B with zero writes** — the check that nothing ping-pongs;
  - no duplicate row anywhere, and `ivritSuite_classes` gets no "the loader normalized it" allowance.
- **`scripts/smoke-sync.mjs`:** a sign-out from the hub and from Name Tags removes the classes; offline with
  a stored session shows the live view and writes nothing; a Dashboard tab and a Name Tags tab open
  together, an edit in one and a pick in the other — the account keeps the edit; a refused `23514`; the hub
  resolves a class conflict; the first-sign-in card after signed-out use.
- `smoke-tools`, `smoke-account`, `smoke-saves`; `test-rls-assignments` and `smoke-assignments` for the
  linking commit; `check-i18n`, `check-inline-js`; the Playwright recipe on all four pages (light and dark,
  desktop and ~800px, English and Hebrew).

## 12. Settled with the maintainer

| Point | Decision |
|---|---|
| A deleted student | *Restore* from the class's own `gone` list; no recovery-bin copy (the bin never evicts, so routine removals would fill it). A deleted **class** goes through the bin |
| A `note` field | Left out of this version (§3) |
| Per-tag overrides in Name Tags | None; the Print tick stays per session and follows the student id (§6.2) |
| Removing a deleted name from the old account rows | On the owning page's next open — the Dashboard for a roster, Name Tags for a list (§7.7). Deleting a class can leave up to three recovery-bin copies on another device (the class, its old roster, its old list) |
| Joining a roster and a list automatically | Exact one-for-one match only (§7.4); anything else is a notice and a confirmed *Merge into…* |
| Names on the Dashboard | A *Names shown* setting: Hebrew, English or both; the default is both, Hebrew first (§6.1) |
| Migration `0013` | Applied through the Supabase connector once Phase 1 is pushed and green, on the maintainer's word at that moment; read back afterwards (§4) |

## 13. Phases after approval

- **Phase 1**, one commit each: `js/ivrit-classes.js` with `scripts/smoke-classes.mjs`; the registry rows and
  the `editing` hook in `js/ivrit-saves.js`; the hub (`alsoPull`, the merge, the three AllTools functions,
  `IVRIT_CFG`, the inventory count); `sw.js` (`CORE_ASSETS`, `VERSION`), the locale rows and the legal text.
- **Phase 2**, one commit per tool: Name Tags (the parser moves out, the panel becomes Class + Edit class),
  the Dashboard, Flash Cards, `reading_assignments.html`.
- This file is then rewritten as the reference, `CLAUDE.md` gets its row in the reference index and its
  binding sentences, and the history goes to the improvement log only.
