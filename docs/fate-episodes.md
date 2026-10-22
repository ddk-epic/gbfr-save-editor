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

| Bit | Value | Name                     | Set on                                                                                                                                 |
| --- | ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 1     | `FATE_EPISODE_LOCKED`    | Locked episodes, and every unused unit                                                                                                 |
| 1   | 2     | `FATE_EPISODE_STARTED`   | Episodes started: a quest episode at its quest start, a text episode at its completion                                                 |
| 2   | 4     | not named                | Every unit                                                                                                                             |
| 3   | 8     | `FATE_EPISODE_COMPLETED` | Completed episodes                                                                                                                     |
| 4   | 16    | `FATE_EPISODE_REVEALED`  | Episodes whose previous episode is completed, and default-unlocked episodes, apart from those of `chara.MinorVersionFlag` 5 characters |

| 3502 | State                                                     |
| ---- | --------------------------------------------------------- |
| 30   | Completed                                                 |
| 14   | Completed, on a default-unlocked flag 5 episode           |
| 22   | Started, not completed: a quest episode during its quest  |
| 20   | Open, not completed                                       |
| 21   | Revealed, locked until the fate episode menu next opens   |
| 4    | Open, not completed, on a default-unlocked flag 5 episode |
| 5    | Locked, and every unused unit                             |

- An episode with a `MissionQuestId` is a quest, played with a forced party. It sets bit 1 as the quest starts and bit 3 on the return. A text episode sets both in one write.
- Completing an episode sets bit 4 on the character's next episode, when it lacks it. Bit 0 clears in a separate write when the fate episode menu opens with the requirements met, so an episode completed from a quest leaves the next one at 21 until then.
- The final episode, `_10`, has no next episode. Completing it flags its `StoryNoteArchiveId1` archive.
- `TROPHY_PROGRESS` counts each character's completed episodes at one `BehaviorId`, such as 42 for `PL1500`, toward an 11-episode trophy; see `trophies.md`.
- `chara_status_fate` holds the HP and ATK bonus rows per character, numbered in `Unk6`. The numbers do not follow a fixed episode, so completed episodes do not map to bonus rows by position.
- No unit holds the sigil slots that quest episodes unlock.

### Completion rewards

| Row column            | Unit                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `MissionQuestId`      | 2561 `FATE_QUEST_CLEARED` at the quest's index in 2560; see `quests.md`                  |
| `ItemReward`          | The item's 1802 count up by 1, 1803 bit 2 and, for a key item, bit 5; see `inventory.md` |
| `StoryNoteArchiveId1` | 7902 `ARCHIVE_UNLOCKED` on that archive; see `journal.md`                                |

- `FATE_PL0600_09` is the one episode with an `ItemReward`, the key item `ITEM_70_0011`. Only the final episodes, `_10`, have a `StoryNoteArchiveId1`.
- Completion also counts toward trophies: the character's own 5815 entry, and on the final episode several shared ones; see `trophies.md`.

## Open

- Bit 2 is set on every unit and has no meaning assigned.
- 2907 at entity 0 goes down by 1 at the end of each quest episode.
