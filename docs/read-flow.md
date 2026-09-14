# Reading a save

The library turns a `SaveData*.dat` file into typed objects in two stages. `readSave` parses the whole file into generic units. A domain reader then picks the units for one feature and interprets them.

```ts
const save = readSave(bytes);
const archives = readArchives(save.slotData.units);
```

## Stage 1, format

`readSave` in `src/format/read-save.ts` runs three steps. None of them know what a unit means.

### Container

`readContainer` in `src/format/container.ts` reads the 0x34 byte header. It holds the main and sub versions, the Steam ID, and the offset and size of SystemData and SlotData. It cuts both sections out of the file. The last 0x14 bytes of SlotData are a footer that gives the offset and byte count of the ten xxHash64 checksums. `readContainer` reads the checksums and trims them off, so `slotData` ends at the FlatBuffer. `save-checksum.md` lists the hashed ranges.

Every offset and size gets checked against the file. A section out of bounds or a footer that does not line up throws `SaveFormatError`.

### FlatBuffer

`decodeSaveDataBinary` in `src/format/save-data-binary.ts` decodes each section. The root table has a version field, absent in SystemData, then one vector per value type in this order.

`bool`, `byte`, `ubyte`, `short`, `ushort`, `int`, `uint`, `long`, `ulong`, `float`

Each vector entry is a unit table with an IDType, a UnitID and a value vector of that type. The decoder returns them as a flat list.

```ts
{ valueType: "uint", idType: 7902, unitId: 3, values: [3] }
```

### Unit store

`UnitStore` in `src/format/unit-store.ts` indexes the units by IDType, then UnitID. It throws if one IDType appears under two value types, or if an IDType and UnitID pair appears twice.

| Method                              | Returns                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `get(idType, unitId)`               | One unit, or undefined                                      |
| `ofIdType(idType)`                  | All units of an IDType, ascending by UnitID                 |
| `values(idType, unitId, valueType)` | The unit's values, throwing if it is stored as another type |

The result is a `Save` with `header`, `checksums`, `systemData` and `slotData`. Each section has a `version` and a `units` store.

## Stage 2, domain

The readers in `src/domain/` give units meaning. Three sources supply it.

- `src/domain/layout.ts` names the IDTypes, the UnitID bases and the flag bits.
- `src/data/*.ts` maps key hashes back to game table keys. `pnpm gen:data` generates these files.
- `keyOf` in `src/domain/keys.ts` does the lookup. It returns undefined for the hash of an empty string, which marks an empty slot. A hash missing from the table comes back as `#` plus 8 hex digits, with one console warning per hash.

Most readers follow the same pattern.

1. List the key units with `ofIdType`.
2. Turn each key hash into a name with `keyOf`, skipping empty slots.
3. Read the related values at the same UnitID, or at one derived from it, such as `CHARACTER_PROGRESS + character index * 1000 + entry`.
4. Decode flag bits and build the object.

### Example, Journal Archives

`readArchives` in `src/domain/journal.ts` reads IDType 7901 for the archive key and 7902 for its flags. Units with the same UnitID belong to one entry. Suppose SlotData holds these units.

| IDType | UnitID | Type | Values         |
| ------ | ------ | ---- | -------------- |
| 7901   | 0      | uint | `[0x00178066]` |
| 7902   | 0      | uint | `[3]`          |
| 7901   | 1      | uint | `[0x0326a9e4]` |
| 7902   | 1      | uint | `[1]`          |

For UnitID 0, `keyOf(ARCHIVE_KEYS, 0x00178066)` gives `ARC_OTHER_004`. `values(7902, 0, "uint")` gives `[3]`. `ARCHIVE_OBTAINED` is 1 and `ARCHIVE_VIEWED` is 2, so the entry is obtained and viewed. UnitID 1 has only the obtained bit, and the game shows it with the new mark.

```ts
[
  { key: "ARC_OTHER_004", obtained: true, viewed: true },
  { key: "ARC_OTHER_066", obtained: true, viewed: false },
];
```

### Example, profile

`readProfile` in `src/domain/profile.ts` needs no key lookup. It reads one value at a fixed address, IDType 4901 at UnitID 10600, and falls back to 0 when the unit is missing.

```ts
units.values(ID.PROFILE_QUESTS_CLEARED, UNIT.PROFILE, "int")?.[0] ?? 0;
```
