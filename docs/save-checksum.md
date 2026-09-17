# SlotData checksum

The game rejects a save whose SlotData fails an xxHash64 checksum, so a writer that changes SlotData recomputes it. Evidence comes from `tmp/SaveData1.dat`, a save at slot version 31, and from in-game load tests.

## Rule

The SlotData FlatBuffer is followed by ten u64 xxHash64 checksums, then a u64 checksum offset, a u64 checksum byte count of 0x50 and a u32 of 1. Hash `i` covers `slot[start, checksumOffset - sub)` with seed `0x2F1A43EBCD`, where `slot` starts at the header's SlotData offset and `checksumOffset` is the footer value, the end of the FlatBuffer.

| Index | start | sub  |
| ----- | ----- | ---- |
| 0     | 0x58  | 0x80 |
| 1     | 0x30  | 0xA0 |
| 2     | 0x28  | 0x30 |
| 3     | 0x38  | 0xC0 |
| 4     | 0x40  | 0xB0 |
| 5     | 0x68  | 0x50 |
| 6     | 0x48  | 0x60 |
| 7     | 0x70  | 0x90 |
| 8     | 0x50  | 0x40 |
| 9     | 0x60  | 0x70 |

The table is `SaveGameFile.HashSectionInfos` in GBFRDataTools.SaveFile.

Only one of the ten is valid. Unit 1003, `SAVE_HASHSEED`, selects it as `value % 10`. The other nine hold stale values from earlier saves, and the game ignores them. A writer recomputes the hash at the selected index and leaves the rest alone. The approach comes from xcier/GBFR-Save-Editor, `gbfr_editor/core/gbfr_save.py`, which updates only that index and warns that updating all ten makes a file look less like a game-written save.

## Evidence

The xxHash64 port returns `ef46db3751d8e999` for an empty input with seed 0, the reference value.

| Save                           | 1003     | Index | Matching indices |
| ------------------------------ | -------- | ----- | ---------------- |
| Original                       | 55732345 | 5     | 5                |
| Restored by the game           | 55734280 | 0     | 0                |
| Original with one byte flipped | 55732345 | 5     | none             |

Expecting all ten to match finds none valid. The rule matches exactly one per save, the one 1003 selects.

## Enforcement

The game rejects a save whose selected checksum does not match. The flipped save changes sigil flags 2707 at UnitID 30050 from 2 to 0, clearing the seen bit of a Tyranny V+, and keeps the original footer. On load the game shows "Slot 1 contains corrupted data. Restore the data and start the game in this slot?".

The same flipped save with only index 5 recomputed loads with no prompt, and the Tyranny V+ shows the new mark. It differs from the original in the flag byte and the 8 checksum bytes, with 1003 and SystemData unchanged.

Accepting the prompt restores the game's backup of the last good save, without the edit, and saves it again. Against the original that re-save changes only these units:

| Unit                  | Change                                          |
| --------------------- | ----------------------------------------------- |
| 1003                  | new seed, 55732345 to 55734280                  |
| SystemData 803, 811   | the same new seed                               |
| 7201                  | long, a millisecond timestamp, about 22 h later |
| 8903, 8909            | each up by 1                                    |
| 4003 at 118, 119, 123 | 8 to 10                                         |
| 4103, 7601 value 0    | changed, unmapped                               |

Every save rerolls 1003, so the selected index moves from save to save. SystemData carries the seed in 803 and 811, so a writer that changes 1003 changes both blobs. A writer that keeps 1003 needs neither.

Swapping a whole save between accounts works once the header's Steam ID is changed. The header lies outside every hashed range, so that is no evidence against the checksum.

## Open

- No load test has changed SystemData 803 or 811 apart from 1003.
- No load test has used a save re-encoded by the codec instead of patched in place. FlatBuffers encoding is not unique, so re-encoding can change the size of the hashed range.
