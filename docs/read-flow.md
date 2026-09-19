# Reading a save

The library turns a `SaveData*.dat` file into typed objects in two stages. `readSave` parses the whole file into generic units. A domain reader then picks the units for one feature and interprets them.

```ts
const save = readSave(bytes);
const archives = readArchives(save.slotData.units);
```

## Stage 1, core

`readSave` in `src/core/read-save.ts` runs three steps. None of them know what a unit means.

### Container

`readContainer` in `src/core/container.ts` reads the 0x34 byte header. It holds the main and sub versions, the Steam ID, and the offset and size of SystemData and SlotData. It cuts both sections out of the file. The last 0x14 bytes of SlotData are a footer that gives the offset and byte count of the ten xxHash64 checksums. `readContainer` reads the checksums and trims them off, so `slotData` ends at the FlatBuffer. `save-checksum.md` lists the hashed ranges.

Every offset and size gets checked against the file. A section out of bounds or a footer that does not line up throws `SaveFormatError`. Its `issue` holds a `code` naming the failed check and that check's parameters, such as `{ code: "outOfBounds", what: "SlotData", at, size, length }`, so callers phrase the reason in their own language. The library holds no text for them; the message is the code and its parameters.

### FlatBuffer

`decodeSaveDataBinary` in `src/core/save-data-binary.ts` decodes each section. The root table has a version field, absent in SystemData, then one vector per value type in this order.

`bool`, `byte`, `ubyte`, `short`, `ushort`, `int`, `uint`, `long`, `ulong`, `float`

Each vector entry is a unit table with an attribute, an entity and a value vector of that type. The decoder returns them as a flat list.

```ts
{ valueType: "uint", attribute: 7902, entity: 3, values: [3] }
```

### Unit store

`UnitStore` in `src/core/unit-store.ts` indexes the units by attribute, then entity. It throws if one attribute appears under two value types, or if an attribute and entity pair appears twice.

| Method                                    | Returns                                                     |
| ----------------------------------------- | ----------------------------------------------------------- |
| `of(entity)`                              | A cursor reading typed attributes at that entity            |
| `get(attribute, entity)`                  | One unit, or undefined                                      |
| `entitiesWith(attribute, range?)`         | Entities holding an attribute, ascending                    |
| `entitiesWhere(attribute, value, range?)` | Entities whose first value equals `value`                   |
| `withAttribute(attribute)`                | All units of an attribute, ascending by entity              |
| `values(attribute, entity, valueType)`    | The unit's values, throwing if it is stored as another type |

The result is a `Save` with `header`, `checksums`, `systemData` and `slotData`. Each section has a `version` and a `units` store.

## Stage 2, domains

`src/domains/` holds one module per thing: sigil, weapon, character, journal and the rest. Each has two files.

- `attributes.ts` names the attribute numbers, the entity ranges and the flag bits, and states the value type each attribute is stored as. It says where a thing lives and nothing about reading it, so reading and writing can both build on it.
- `read.ts` holds the record type and the functions producing it.

`src/read/` holds the compositions that span several domains, `readInventory` and `readCharacterData`. `src/data/*.ts` maps key hashes back to game table keys; `pnpm gen:data` generates these files.

### Typed attributes

An attribute is declared once, with its number, its value type and how its values become a field.

```ts
export const SIGIL_ID = Attribute.uint(2702);
export const SIGIL_KEY = keyAttribute(2703, GEMS);
export const SIGIL_LEVEL = Attribute.int(2704);
export const SIGIL_FLAGS = Attribute.flags(2707, { locked: 1, seen: 2 });
```

A reader positions on an entity and reads through them. The value type is checked against the unit, so a mismatch throws instead of returning a wrong number.

```ts
const at = units.of(entity);
at.get(SIGIL_LEVEL); // number
at.get(SIGIL_FLAGS); // { locked: boolean, seen: boolean }
```

`keyAttribute` resolves a hash to its archive key. `keyOf` in `src/core/keys.ts` does the lookup and takes the table as a parameter, so it holds no table of its own. It returns undefined for the hash of an empty string, which marks an empty slot. A hash missing from the table comes back as `#` plus 8 hex digits, with one console warning per hash.

### Records carry their coordinates

Every record carries the entity it was read from, and its id where it has one. The entity is the address a write would patch. The id is what equip positions point at, and it is not the entity: `entity - range start` never equals the id in a played save.

```ts
{ entity: 30417, id: 4021, key: "GEM_101_01", level: 15, ... }
```

### The usual shape

1. List the entities holding the key attribute with `entitiesWith`, narrowed by an `EntityRange` where the attribute serves more than one feature.
2. Position on each with `of`, and read the key. An empty slot reads as undefined and is skipped.
3. Read the related attributes at the same entity, or at one derived from it, such as a character's mastery block.
4. Return the record with its entity.

### Example, Journal Archives

`readArchives` in `src/domains/journal/read.ts` reads attribute 7901 for the archive key and 7902 for its flags. Units with the same entity belong to one entry. Suppose SlotData holds these units.

| Attribute | Entity | Type | Values         |
| --------- | ------ | ---- | -------------- |
| 7901      | 0      | uint | `[0x00178066]` |
| 7902      | 0      | uint | `[3]`          |
| 7901      | 1      | uint | `[0x0326a9e4]` |
| 7902      | 1      | uint | `[1]`          |

For entity 0, `ARCHIVE_KEY` resolves `0x00178066` to `ARC_OTHER_004`. `ARCHIVE_FLAGS` reads `[3]` against `{ unlocked: 1, viewed: 2 }`, so the entry is unlocked and viewed. Entity 1 has only the unlocked bit, and the game shows it with the new mark.

```ts
[
  { key: "ARC_OTHER_004", unlocked: true, viewed: true },
  { key: "ARC_OTHER_066", unlocked: true, viewed: false },
];
```

### Example, profile

`readProfile` in `src/domains/profile/read.ts` needs no key lookup. It reads one value at a fixed address, attribute 4901 at entity 10600, and falls back to 0 when the unit is missing.

```ts
units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED);
```
