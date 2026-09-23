# Testing

Every test builds the save data it needs in memory. No test reads a `SaveData*.dat`, so the suite runs the same on any checkout.

A fixture is not mock data. Its keys are real game keys and its tables are the generated ones, so a reader resolving a key in a test runs the lookup it runs on a real save. Only the layout and the values are chosen: which entity holds what, a level of 100, a count of 3, a level of 11 to trip a check.

```
pnpm test
```

## Fixtures

`src/testing.ts` builds units from typed attributes. A value that is not an array stands for a unit holding that one value.

```ts
const units = unitStore({
  [SIGIL_FIRST]: [
    [SIGIL_ID, 71],
    [SIGIL_KEY, hashId("GEEN_158_13")],
  ],
});
```

- `unitStore(entities)` gives a `UnitStore`, the seam every reader takes.
- `fixtureSave({ slotData })` wraps one in a `Save` with a valid header and checksums, for `validateSave`. `header` overrides single header fields.
- `sampleUnits()` holds one character, one item and one sigil, for anything reading across domains.
- `fixtureFile(entities)` gives the bytes of a whole save file around the units, for `readSave` and `SaveSession`. It computes the checksum `SAVE_HASHSEED` selects when the units hold one. `encodeSaveDataBinary(units)` gives the FlatBuffer alone. Its layout differs from the game's, and the decoder reads it back as the same units.

`hashId(key)` stores a key the way the save does. The key has to come from the table the attribute reads against, or the reader warns and keeps the hash: `SKILL_000_00` is a gem trait, not one of the skills a loadout equips. `src/data` is the list to pick from.

## Layout

| Path                    | Holds                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| `test/core/`            | The container, the unit store, the hashes                               |
| `test/session/`         | `SaveSession`: patching, export and the checksum it recomputes          |
| `test/domains/`         | One file per `src/domains` module with a reader or checks worth pinning |
| `test/read/`            | The readers spanning domains, and their checks                          |
| `test/data.test.ts`     | The generated `src/data` tables on their own, no reader and no save     |
| `test/validate.test.ts` | `validateSave` over a whole save                                        |

A function belongs to the test of the module that exports it, whatever table it reads. `questOrder` indexes `QUEST_COUNTER`, so it is tested in `test/domains/quest.test.ts`, while `test/data.test.ts` holds the claims about `QUEST_COUNTER` itself.

## Gaps

Reading bytes the game wrote has no test: `readSave` reads fixture files, whose layout is the test encoder's. `pnpm check:save` runs it over real files, and the app runs it on every save opened.

`readRecentPlayers` is read by no test. The rest of the readers are covered by their own domain test or through `readInventory` and `readCharacterData`, whose fixtures hold a row per collection.
