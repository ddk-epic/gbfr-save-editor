# Journal

A journal list is a key unit per table row with a flags unit beside it.

## Lists

| Section                   | Key  | Flags | Entities | Name prefix               | Table                          |
| ------------------------- | ---- | ----- | -------- | ------------------------- | ------------------------------ |
| Archives                  | 7901 | 7902  | 0-99     | `ARCHIVE_`                | `story_note_archive`           |
| Glossary                  | 8101 | 8102  | 0-149    | `GLOSSARY_`               | `story_note_wordlist`          |
| Main Story                | 8201 | 8202  | 0-329    | `STORY_`                  | `story`                        |
| Music Collection          | 8301 | 8302  | 0-199    | `MUSIC_`                  | `story_note_bgm`               |
| Field Notes, Characters   | 8401 | 8402  | 0-49     | `FIELD_NOTE_CHARACTER_`   | `story_note_picturebook_chara` |
| Field Notes, Foes         | 8501 | 8502  | 0-149    | `FIELD_NOTE_FOE_`         | `story_note_picturebook_enemy` |
| Field Notes, Wrightstones | 8601 | 8602  | 0-9      | `FIELD_NOTE_WRIGHTSTONE_` | `story_note_picturebook_code`  |
| Tips                      | 8701 | 8702  | 0-499    | `TIP_`                    | `story_note_tips`              |

- Each key attribute is named `<prefix>KEY` and each flags attribute `<prefix>FLAGS`, both `uint`.
- Every list holds every row of its table from a new game on, and the empty hash after the last row.
- Bit 0 (value 1) is the entry being listed or unlocked. Bit 1 (value 2) is its new mark being cleared, where the section has one.

## Archives

Three categories, `story_note_archive_category`, each listing the rows of its `CategoryId` in `SortOrder` order. A document's title is `NoteTitle` in `text_note.msg`.

| Category              | `CategoryId` | Keys               |
| --------------------- | ------------ | ------------------ |
| Obtained Documents    | 0            | `ARC_OTHER_*`      |
| Records of a Handyman | 1            | `ARC_ROLANNOTE_*`  |
| Classified Records    | 2            | `ARC_LILITHNOTE_*` |

| Bit | Value | Name               | Holds                                     |
| --- | ----- | ------------------ | ----------------------------------------- |
| 0   | 1     | `ARCHIVE_UNLOCKED` | Obtained. A document without it shows ??? |
| 1   | 2     | `ARCHIVE_SEEN`     | The new mark is cleared                   |

## Glossary

Six tabs: General, Peoples, Primal Beasts, Skydoms, Places and Organizations. They are the `story_note_wordlist` column the extractor names `ShownByDefault`, 0-5, and each lists its rows in table order. `CategoryId` does not match the tabs.

8101 is the hash of `WORDLIST_nnnn`, nnnn the last four digits of the row key. Titles are `TXT_GLOSSARY_TTL_nnnn` and paragraphs `TXT_GLOSSARY_BODY_nnnn_01` to `_04` in `text_note.msg`. `_load` is a loading screen text, not a paragraph.

| Bits | Values | Name                | Holds                                             |
| ---- | ------ | ------------------- | ------------------------------------------------- |
| 0    | 1      | `GLOSSARY_UNLOCKED` | Listed                                            |
| 1    | 2      | `GLOSSARY_SEEN`     | The new mark is cleared                           |
| 2-4  | 4-16   | not named           | Paragraphs 2-4, one bit per paragraph the row has |
| 5-8  | 32-256 | not named           | One bit per paragraph, on seen rows only          |

- Leaving and re-entering the list clears every new mark.

## Main Story

The Story So Far and 14 chapters, the rows of `story_note_chapter`: key 0, then Prologue to Epilogue at keys 1-14. Each entry is a `story` row.

| `story` column | Holds                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `Unk10`        | Chapter key                                                                                                 |
| `Unk12`        | Chapter \* 10000 plus a step of 10, the position in the list; 0 when not listed                             |
| `Unk13`        | Kind: 0 (`ct`) and 5 (`cm`) video, 1 (`cw`) dialogue only, 2 (`tt`) The Story So Far entry, 4 in-game event |

8201 is the key hash, or for a row whose key is 8 hex digits the value they spell.

| Bit | Value | Name             | Holds                   |
| --- | ----- | ---------------- | ----------------------- |
| 0   | 1     | `STORY_UNLOCKED` | Unlocked                |
| 1   | 2     | `STORY_SEEN`     | The new mark is cleared |

- The save holds the rows in an order of its own, not the order the game lists.
- Bit 0 covers the in-game events too, which the journal never lists.
- A new game starts every row with bit 1 set. A row loses it when it first becomes browsable, and gets it back once opened. Videos the game plays by itself are never opened from the list.
- Profile story progress, 4705, counts the chapters from the Prologue at 0 and skips Days of Our Zegagrande.

## Music Collection

One list without tabs: the `story_note_bgm` rows in `SortOrder` order. Titles are `MusicTitle` in `text_note.msg`.

| Bit | Value | Name             | Holds                   |
| --- | ----- | ---------------- | ----------------------- |
| 0   | 1     | `MUSIC_UNLOCKED` | Listed                  |
| 1   | 2     | `MUSIC_SEEN`     | The new mark is cleared |

## Tips

Eight tabs, the rows of `story_note_tips_category`. The extractor's column names for `story_note_tips` are shifted: `Unk25` is the tab key, `CategoryId` the order within it, and `TextBodyIdController` the `tutorial_window.Key` whose `TitleTextId` names the tip, or else `Unk18` holds a `TXT_TIPS_TITLE_*`.

8701 is the hash of `TutorialWindowIdUnlockRequirement`.

| Bit | Value | Name           | Holds                   |
| --- | ----- | -------------- | ----------------------- |
| 0   | 1     | `TIP_UNLOCKED` | Listed                  |
| 1   | 2     | `TIP_SEEN`     | The new mark is cleared |

- A new game starts most rows with bit 1 set, as in Main Story.
- A row listed on several platforms has one row per `FormatAndIsVisible` value, and the game lists it once.
- The row with `QuestId` 1 is never listed.

## Field Notes

Five categories, `story_note_picturebook_category`. Characters, Foes and Wrightstones have lists of their own. Weapons and Treasure ride on lists the save keeps for other reasons.

| Category     | Key  | Flags | Registered | Lists                                                                                                    |
| ------------ | ---- | ----- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Characters   | 8401 | 8402  | Bit 0      | The `story_note_picturebook_chara` rows, one captain only                                                |
| Foes         | 8501 | 8502  | Bit 0      | The `story_note_picturebook_enemy` rows with `IsBossEnemy` 1                                             |
| Weapons      | 7401 | 7403  | Bit 2      | `weapon` rows with `unk52` 1 and no `WeaponId`, without the other captain and the two Apocalypse weapons |
| Treasure     | 1801 | 1803  | Bit 2      | The `item` rows at `SortOrder` 100-922, the four Curios as one                                           |
| Wrightstones | 8601 | 8602  | Bit 0      | The `story_note_picturebook_code` rows in `SortOrder2` order                                             |

- Registered is the entry having a page.
- The Characters counter leaves out the captain not picked.
- Treasure is the one category with a seen bit, `ITEM_SEEN` on the item unit.

### Weapons list

| Attribute | Name                      | Type   | Holds                                                     |
| --------- | ------------------------- | ------ | --------------------------------------------------------- |
| 7401      | `FIELD_NOTE_WEAPON_KEY`   | `uint` | `weapon.Key`                                              |
| 7402      | not named                 | `bool` | No meaning assigned                                       |
| 7403      | `FIELD_NOTE_WEAPON_FLAGS` | `uint` | Bit 2 (value 4), `FIELD_NOTE_WEAPON_UNLOCKED`, registered |

The list covers entities 0-511.

## Open

- 8402 and 8502 bits above 0 have no meaning assigned. They are not cumulative: bit 1 clears as a higher bit sets.
- 8102 bits 5-8 do not show a paragraph, and no save has a seen row without them.
- 7403 bit 0 is set without bit 2 on some weapons. 7402 climbs with progress, but nothing ties it to a new mark.
