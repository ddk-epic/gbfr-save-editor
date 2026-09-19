# Player profiles

A profile card is one entity holding a player's online profile, in the format of the game's online player list. The save holds the player's own card and the cards of players met in group play, in separate lists.

## Lists

| Entities    | Name                  | Holds                                         |
| ----------- | --------------------- | --------------------------------------------- |
| 10600       | `PROFILE_FIRST`       | The player's own card                         |
| 10700-10749 | not named             | Not known                                     |
| 10800-10849 | not named             | Not known                                     |
| 10900-10949 | `RECENT_PLAYER_FIRST` | The last 50 players queued with, newest first |

- Recent player cards come in runs of one to three with the same last seen time and the same 4707, one run per quest.
- The attributes 4601-4608 are named `ONLINEPLAYERLIST_*` in the game.

## The card

Every card, own or recent, uses the same attributes.

| Attribute | Name                     | Type   | Holds                                                            |
| --------- | ------------------------ | ------ | ---------------------------------------------------------------- |
| 4502      | not named                | `byte` | A second name, NUL-padded, not shown                             |
| 4503      | `PLAYER_LAST_SEEN`       | `long` | Last seen, Unix time in milliseconds                             |
| 4506      | `PLAYER_NAME`            | `byte` | Player name, NUL-padded                                          |
| 4510      | `PLAYER_ID`              | `byte` | Player ID, 16 hex digits as text                                 |
| 4601      | not named                | `uint` | Favorite character, `chara.CharId`, the empty hash for none      |
| 4603      | not named                | `int`  | Title, `badge.Key`, -1 for none                                  |
| 4604      | not named                | `byte` | About-me text, 240 bytes, NUL-padded                             |
| 4605      | not named                | `int`  | Availability start, hour and minute, -1 when unset               |
| 4606      | not named                | `int`  | Availability end, hour and minute, -1 when unset                 |
| 4703      | not named                | `int`  | Commendations                                                    |
| 4705      | not named                | `int`  | Story progress                                                   |
| 4706      | `PLAYER_GRADE`           | `int`  | Skyfarer grade                                                   |
| 4707      | `PLAYER_QUEST`           | `uint` | The quest played together, a quest id as in the `quest_*` tables |
| 4708      | not named                | `int`  | Quested with this player                                         |
| 4901      | `PROFILE_QUESTS_CLEARED` | `int`  | Quests cleared                                                   |
| 5001      | not named                | `uint` | `weapon.Key` of the most used weapon                             |
| 5002      | not named                | `int`  | Its level                                                        |
| 5003      | not named                | `int`  | Its plus level                                                   |

| 4705 | Story progress            |
| ---- | ------------------------- |
| 11   | Chapter Ø Skybound Heart  |
| 12   | Epilogue Endless Ragnarok |

| 4706 | Skyfarer grade                                        |
| ---- | ----------------------------------------------------- |
| 1    | Veteran Skyfarer                                      |
| 2    | Zegagrande Legend                                     |
| 3    | Fatebreaker                                           |
| 4    | Fatebreaker (Infinity), `TXT_ROOM_SET_GRADE_INFINITY` |

- The profile screen shows grades 3 and 4 both as Fatebreaker. No other card attribute tells them apart.

## Card characters

The characters on a card sit at card entity \* `CARD_CHARACTER_STRIDE` (100) + `i`, so the own card's characters start at 1060000 and the recent players' at 1090000.

| `i`   | Character                      |
| ----- | ------------------------------ |
| 0     | The character last played      |
| 10-12 | The three most used characters |

| Attribute | Name                          | Type    | Holds                 |
| --------- | ----------------------------- | ------- | --------------------- |
| 4801      | `CARD_CHARACTER_KEY`          | `uint`  | `chara.CharId`        |
| 4802      | not named                     | `int`   | No meaning assigned   |
| 4803      | `CARD_CHARACTER_LEVEL`        | `int`   | Level                 |
| 4804      | `CARD_CHARACTER_QUESTS_USED`  | `int`   | Times used in a quest |
| 4805      | `CARD_CHARACTER_MASTER_LEVEL` | `ubyte` | Master level          |
| 4806      | not named                     | `bool`  | No meaning assigned   |

- On the own card, 4804 of the most used characters equals `CHARACTER_QUESTS_USED` (1314) on the character unit.
- 4805 is the stored master level. The game caps what it shows at 50.

## Open

- What the lists at 10700 and 10800 hold.
- 4501, 4504, 4505, 4507, 4509, 4602, 4607, 4608, 4702, 4704, 4802 and 4806 have no meaning assigned.
- The own card's 4703 can sit one below `USERDATA_COMMENDATIONS` (1106) at entity 0.
- 1901-1904 at 10600-10949 are the rewards of curios 106-109, not card attributes.
