# Fate episodes

A fate episode is one unit per `fate_episode` row.

## The fate episode unit

Fate episodes occupy entities 0-819. The `fate_episode` rows fill them from 0, and the rest hold the empty hash with state 5.

| Attribute | Name                 | Type   | Holds              |
| --------- | -------------------- | ------ | ------------------ |
| 3501      | `FATE_EPISODE_KEY`   | `uint` | `fate_episode.Key` |
| 3502      | `FATE_EPISODE_STATE` | `uint` | State bits         |

- Each playable character has 11 episodes, `FATE_<CharaId>_00` to `_10`, in the order the menu lists them.
- Some characters also have a `REMI_<CharaId>_00` unit. It has no `FateMissionTitle` or level requirement, holds state 5 and does not show in the menu.

### State

| Bit | Value | Name                     | Set on                                                                                                     |
| --- | ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 0   | 1     | not named                | Some open and some locked episodes                                                                         |
| 1   | 2     | not named                | Completed episodes only                                                                                    |
| 2   | 4     | not named                | Every unit                                                                                                 |
| 3   | 8     | `FATE_EPISODE_COMPLETED` | Completed episodes                                                                                         |
| 4   | 16    | not named                | Open and completed episodes, apart from the default-unlocked ones of `chara.MinorVersionFlag` 5 characters |

| 3502   | State                                                     |
| ------ | --------------------------------------------------------- |
| 30     | Completed                                                 |
| 14     | Completed, on a default-unlocked flag 5 episode           |
| 20, 21 | Open, not completed                                       |
| 4      | Open, not completed, on a default-unlocked flag 5 episode |
| 5      | Locked, and every unused unit                             |

- `chara_status_fate` holds the HP and ATK bonus rows per character, numbered in `Unk6`. The numbers do not follow a fixed episode, so completed episodes do not map to bonus rows by position.
- The unlock requirements do not explain bit 4: other characters also open their first episodes by default and keep it set.

## Open

- Bits 0 and 4 have no meaning assigned.
