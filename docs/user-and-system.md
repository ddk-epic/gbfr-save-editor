# User and system data

SystemData and the start of SlotData hold the save-wide state: save versions, the play timer, the current stage, the player name, currencies and a few unnamed counters and flag sets. Every attribute here has a single unit at entity 0.

## SystemData

SystemData uses attributes 801-841 and has no version field.

| Attribute | Name                   | Type       | Holds                                                 |
| --------- | ---------------------- | ---------- | ----------------------------------------------------- |
| 801       | not named              | `ushort`   |                                                       |
| 802       | not named              | `ushort`   |                                                       |
| 803       | `SYSTEM_HASHSEED`      | `uint`     | Copy of 1003                                          |
| 811       | `SYSTEM_HASHSEED_2`    | `uint`     | Copy of 1003                                          |
| 812       | `SYSTEM_PLAY_TIME`     | `ulong`    | Play time in seconds, capped at 3,599,999 (999:59:59) |
| 813       | `SYSTEM_STAGE`         | `int`      | Stage, see [Location](#location)                      |
| 814       | `SYSTEM_PLAYER_NAME`   | `byte[64]` | Player name, one byte per character, padded with 0    |
| 815       | not named              | `uint`     |                                                       |
| 816       | not named              | `byte`     |                                                       |
| 817       | not named              | `byte`     |                                                       |
| 818       | not named              | `int`      |                                                       |
| 819       | `SYSTEM_STAGE_2`       | `int`      | Stage, see [Location](#location)                      |
| 820       | not named              | `bool`     |                                                       |
| 822       | not named              | `int[4]`   |                                                       |
| 823       | not named              | `int[4]`   |                                                       |
| 824       | not named              | `bool`     |                                                       |
| 825       | not named              | `bool`     |                                                       |
| 826       | not named              | `bool`     |                                                       |
| 827       | not named              | `bool`     |                                                       |
| 828       | not named              | `bool`     |                                                       |
| 829       | not named              | `bool`     |                                                       |
| 830       | not named              | `byte`     |                                                       |
| 831       | not named              | `bool`     |                                                       |
| 832       | not named              | `bool`     |                                                       |
| 833       | not named              | `int`      |                                                       |
| 834       | `SYSTEM_PLAYER_NAME_2` | `byte[64]` | Player name, one byte per character, padded with 0    |
| 835       | not named              | `bool`     |                                                       |
| 836       | not named              | `byte`     |                                                       |
| 837       | not named              | `bool`     |                                                       |
| 838       | not named              | `bool`     |                                                       |
| 839       | not named              | `ubyte`    |                                                       |
| 840       | not named              | `ubyte`    |                                                       |
| 841       | not named              | `bool`     |                                                       |

## SlotData versions

| Attribute | Name                   | Type     | Holds                                                     |
| --------- | ---------------------- | -------- | --------------------------------------------------------- |
| 1001      | `SAVE_SLOT_VERSION`    | `ushort` | Slot serialization version: 31 on game 2.0.5, 32 on 2.0.6 |
| 1002      | `SAVE_FEATURE_VERSION` | `ushort` | Feature version, 6 on game 2.0.1                          |
| 1003      | `SAVE_HASHSEED`        | `uint`   | Random seed generated with the save                       |

The game rejects a save whose 1001 or 1002 is higher than its own version expects.

## User data

User data uses attributes 1101-1151.

| Attribute | Name                       | Type         | Holds                                                               |
| --------- | -------------------------- | ------------ | ------------------------------------------------------------------- |
| 1101      | `USER_PLAYER_NAME`         | `ushort[32]` | Player name, one character code per value, padded with 0            |
| 1102      | not named                  | `int`        | Always 1                                                            |
| 1103      | `USER_CAPTAIN`             | `int`        | Captain picked at the start: 1 Gran, 2 Djeeta                       |
| 1104      | `USER_RUPIES`              | `int`        | Rupies                                                              |
| 1105      | not named                  | `int`        |                                                                     |
| 1106      | `USER_COMMENDATIONS`       | `int`        | Commendations, as the player page shows                             |
| 1107      | not named                  | `bool`       |                                                                     |
| 1108      | `USER_ONLINE_STATUS_FLAGS` | `uint`       | Online status flags                                                 |
| 1109      | not named                  | `int`        |                                                                     |
| 1110      | not named                  | `int`        |                                                                     |
| 1111      | not named                  | `int`        |                                                                     |
| 1112      | `USER_MASTERY_POINTS`      | `int`        | MSP                                                                 |
| 1113      | not named                  | `bool[256]`  | Flag set                                                            |
| 1114      | not named                  | `bool`       |                                                                     |
| 1115      | not named                  | `uint`       | Hash-like                                                           |
| 1116      | `USER_RESONANCE_POINTS`    | `int`        | Resonance points, spent on the Resonance tree                       |
| 1151      | not named                  | `uint[58]`   | One entry per value: the low byte is its index, the high byte flags |

The player name also appears at 4413 and 4506.

## Location

Location uses attributes 1201-1207.

| Attribute | Name                | Type        | Holds                                                                              |
| --------- | ------------------- | ----------- | ---------------------------------------------------------------------------------- |
| 1201      | `LOCATION_STAGE`    | `int`       | Current stage, a `stagename.PhaseId`                                               |
| 1202      | `LOCATION_SPOT`     | `ubyte[32]` | Spot name, ASCII padded with 0                                                     |
| 1203      | not named           | `uint`      |                                                                                    |
| 1204      | not named           | `float[4]`  |                                                                                    |
| 1205      | not named           | `float[4]`  |                                                                                    |
| 1206      | `LOCATION_PARTY_HP` | `int[4]`    | HP per party slot. Only the player's slot holds a value, AI and empty slots hold 0 |
| 1207      | not named           | `int[4]`    |                                                                                    |

1206 is a cache. The game recomputes it from the party's gear and writes it on every save, so a value left stale by an edit corrects itself and the HP shows right in the meantime.

`stagename.PhaseId` spells the stage as 8 hex digits, so stage `0xC00` is PhaseId `00000C00`, Folca, Frontier Town. `stagename.Name` is a text key in `text_telop` or `text_ui`. The opening stage `0xA01` has no `stagename` row.

A teleport changes 1201 and SystemData 813 and 819 together. At the start of a new game, 813 and 819 hold `0x800`, Grandcypher Deck, while 1201 holds the opening stage. 1202 stays the same after a teleport.
