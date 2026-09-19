# gbfr-save-editor

Reads Granblue Fantasy: Relink save files, `SaveData*.dat`, into typed records. The save has no fixed record layout. It stores a flat list of values, each tagged with the thing it is about and the characteristic it holds.

## Language

### Save structure

**Unit**:
One stored value, carrying its entity, its attribute, its value type and its values. A unit is identified by the pair of its entity and its attribute, never by either alone.
_Avoid_: cell, record, row

**Entity**:
The thing a unit is about, such as one character, one sigil or one curio. Save wide values sit at entity 0.
_Avoid_: UnitID, unit id, owner, subject, slot

**Attribute**:
The characteristic a unit holds, such as a sigil's level or a character's experience. Every unit of one attribute shares a single value type across the whole save.
_Avoid_: IDType, type number, property, field, column

**Value type**:
The primitive a unit's values are stored as, one of bool, byte, ubyte, short, ushort, int, uint, long, ulong and float. Fixed per attribute.
_Avoid_: data type, primitive

**Entity range**:
A span of entity numbers reserved for one kind of thing. Characters start at 10000, sigils at 30000, weapons at 40000.
_Avoid_: base, offset, section

**Sigil id**, **Weapon id**, **Wrightstone id**:
The number the game gives one owned sigil, weapon or wrightstone, stored with it and used wherever something refers to it. Handed out in order and never reused, so the gaps in a long played save are deletions. Each kind counts on its own, so an id says nothing without knowing its kind. Not positional: it does not say where the save stores the thing, which is its entity.
_Avoid_: slot, slot id, index, serial

**Equip position**:
A place on a character or a loadout that holds a reference to something equipped, counted from 0: twelve sigil positions, four skill positions, one weapon. A position holds an id, never an entity.
_Avoid_: slot, sigil slot, index

**System data**, **Slot data**:
The save's two blobs. System data holds settings. Slot data holds game progress and is the part the readers interpret.
_Avoid_: section, blob, region

### Keys

**Archive key**:
The game table key a hash stands for, such as `GEEN_027_14` or `PL1200`. The save stores hashes; readers resolve them to archive keys.
_Avoid_: name, game key, id

**Key table**:
A generated map from hash to archive key for one game table, built from the extracted game archive.
_Avoid_: lookup, dictionary, index

**Unresolved key**:
A hash with no entry in its key table, carried as `#` followed by 8 hex digits. It means the generated tables cannot say what the hash stands for.
_Avoid_: unknown key, missing key, orphan

**Empty slot**:
A unit holding the hash of the empty string, which the save uses for an unfilled slot. Distinct from an unresolved key, which is a filled slot the tables cannot name.
_Avoid_: null, blank, unset

### Reading

**Reader**:
A function turning the units of one feature into typed records. Readers are the only place that assigns meaning to a unit.
_Avoid_: parser, mapper, loader, decoder

**Mastery block**:
The entity range holding everything one character has earned through the mastery system: over-masteries on the first four entities, then mastery nodes and master trait cells spread across the rest. Nodes and cells sit under the same attribute and are told apart by which generated table recognises the hash. A character's level, experience and base stats are not in here; they sit on the character's own entity.
_Avoid_: character progress, progress block, skillboard
