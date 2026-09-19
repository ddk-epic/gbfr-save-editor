# SlotData checksum

The game rejects a save whose SlotData fails an xxHash64 checksum, so a writer that changes SlotData recomputes it.

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

## Enforcement

- The game rejects a save whose selected checksum does not match, and offers to restore its backup of the last good save.
- Recomputing only the selected index is enough for the game to load the save.
- Every game save rerolls 1003, so the selected index moves from save to save.
- SystemData carries the seed again in 803 and 811, so a writer that changes 1003 changes both blobs. A writer that keeps 1003 needs neither.
- The header lies outside every hashed range.
- The xxHash64 reference value for an empty input with seed 0 is `ef46db3751d8e999`.

## Open

- No load test has changed SystemData 803 or 811 apart from 1003.
- No load test has used a save re-encoded by the codec instead of patched in place. FlatBuffers encoding is not unique, so re-encoding can change the size of the hashed range.
