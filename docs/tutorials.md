# Tutorials

Two lists, a key unit per entity with a flags unit beside it.

| Attribute | Name                    | Type   | Entities | Holds                                  |
| --------- | ----------------------- | ------ | -------- | -------------------------------------- |
| 5901      | `TUTORIAL_WINDOW_KEY`   | `uint` | 0-299    | Hash of a `tutorial_window.Key`        |
| 5902      | `TUTORIAL_WINDOW_FLAGS` | `uint` | 0-299    | Flags of the window at the same entity |
| 6001      | `TUTORIAL_MENU_KEY`     | `uint` | 0-299    | Hash of a `tutorial_menu.Key`          |
| 6002      | `TUTORIAL_MENU_FLAGS`   | `uint` | 0-299    | Flags of the menu at the same entity   |

- The empty hash fills the unused entities of 5901 and 6001.
- 6001 lists each distinct `tutorial_menu.Key` once; the table repeats keys across its rows.
- 5901 also holds hashes that are no `tutorial_window.Key`.

| Bit | Value | Name       | Holds                                                          |
| --- | ----- | ---------- | -------------------------------------------------------------- |
| 0   | 1     | `unlocked` | The tutorial is available. It does not mean the window showed. |

- `TU_PHOTO` and `TUTORIAL_PHOTO` set bit 0 with no window on screen. `TU_LIMITBREAK` and `TUTORIAL_LIMITBREAK` set it as the Over Mastery window appears.
- Bits above 0 have not been seen set.

## Clearing hints

`clearHints` sets bit 0 on each hint below wherever the save holds it, and keeps the row's other bits. It does not depend on the story position, and running it again changes nothing. A hint marked this way does not show as a pop-up when its trigger comes.

| Unit | Name                       | Rows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5902 | `TUTORIAL_WINDOW_FLAGS`    | `TU_MAP`, `TU_SETTING`, `TUTORIAL_WIN_07`, `TUTORIAL_WIN_32`, `TU_ACT_PL0000`, `TU_ACT_PL0100`, `TU_GN`, `TU_BOSSARTSAURA`, `TU_SHOPFUNC`, `TU_CHARATICKET`, `TU_QUESTGUIDE`, `TU_LIMITBREAK`, `TU_PHOTO`, `TUTORIAL_WIN_31`, `TU_MOVETOWN`, `TUTORIAL_WIN_29`, `TU_ITEM`, `TU_NOTE`, `TUTORIAL_WIN_21`, `TU_QUESTRANK`, `TU_SHUFFLEQUEST`, `TU_CHAPTERSELECT`, `TU_GHOST_AI_DISPATCH`, `TU_MENU_QUESTSELECT`, `TU_FAST_TRAVEL`, `TU_STATION`, `TU_ULTIMATE`, `TU_QUESTSTART`, `TU_MATCHINGSETTING`, `TU_RELIC`, `TUTORIAL_WIN_33`, `TU_AWEAPON_UPGRADE`, `TU_AWEAPONLEAD`, `TU_DAHLIA_TRADE`, `TU_TRADE_TICKET`, `TU_GENE_FORGING`, `TU_EXFORGING`, `TU_GENECOMB`, `TU_CHARARELEASE`, `TU_WP_LIMITBREAK`, `TUTORIAL_WIN_28`, `TUTORIAL_WIN_34`, `TU_BLESSING`, `TU_WPMIRAGE`, `TU_SALE`, `TU_WEAPONBONUS`                                                                                                                               |
| 6002 | `TUTORIAL_MENU_FLAGS`      | `TUTORIAL_MAP`, `TUTORIAL_PAD_ASSSGN`, `TUTORIAL_SETTING`, `TUTORIAL_BOSSARTSAURA`, `TUTORIAL_GN`, `TUTORIAL_LIMITBREAK`, `TUTORIAL_PHOTO`, `TUTORIAL_EQUIP`, `TUTORIAL_ABILITYEQ`, `TUTORIAL_ITEM`, `TUTORIAL_NOTE`, `TUTORIAL_QUEST_COUNTER`, `TUTORIAL_QUESTRANK`, `TUTORIAL_SHUFFLEQUEST`, `TUTORIAL_CHAPTERSELECT`, `TUTORIAL_GHOST_AI_DISPATCH`, `TUTORIAL_MENU_QUESTSELECT`, `TUTORIAL_FAST_TRAVEL`, `TUTORIAL_ULTIMATE`, `TUTORIAL_QUESTSTART`, `TUTORIAL_MATCHINGSETTING`, `TUTORIAL_REGION_SETTING`, `TUTORIAL_RELIC`, `TUTORIAL_NOTE_FATE`, `TUTORIAL_AWEAPON_UPGRADE`, `TUTORIAL_AWEAPONLEAD`, `TUTORIAL_DAHLIA_TRADE`, `TUTORIAL_TRADE_TICKET`, `TUTORIAL_GENE_FORGING`, `TUTORIAL_EXFORGING`, `TUTORIAL_GENECOMB`, `TUTORIAL_CHARATICKET`, `TUTORIAL_CHARARELEASE`, `TUTORIAL_WP_LIMITBREAK`, `TUTORIAL_GEEN_STR`, `TUTORIAL_WEP_CRAFT`, `TUTORIAL_BLESSING`, `TUTORIAL_WPMIRAGE`, `TUTORIAL_SALE`, `TUTORIAL_WEAPONBONUS` |
| 8702 | `TIP_FLAGS`                | `NOTE_WINDOW_TIPS_43`, `_48`, `_55`, `_65`, `_80`, `_110`, `_117`, `_118`, `_119`, `_121`, `_127`, `_131`, `_82`, `_83`, `_86`, `_87`, `_99`, `_100`, `_101`, `_96`, `_47`, `_49`, `_93`, `_98`, `_61`, `_89`, `_81`, `_75`, `_76`, `_77`, `_78`, `_79`, `_68`, `_72`, `_71`, `_69`, `_70`, `_73`, `_116`, and 8701 hashes 594130054, 2065024838, `0x06D4F9A2`, `0x98DDC36E`, `0xCB7DB2D1`, `0xBFE7448E`, `0x1C841DC4`, `0x6F1A2D86`, 3720559472, 2043388923, 951310505, 4077825340, 1762558635, 3309052015, 2615852220, 3949543317, 2588951308, `0xBC721835`, `0x0A2B64B3`, `0xD880F0B7`, `0xDE5DA575`, `0xD3D37684`, `0x98471314`, `0x9BFF336C`, `0xC6D546D5`, `0xF85CA133`, `0x94E09A15`, `0x8675C130`, `0x1400D7A6`                                                                                                                                                                                                                  |
| 7302 | `INFORMATION_DIALOG_SHOWN` | `A60431D1` "New Memories Added", `64574A34` "New Options Added", `B4B28AA5` new stickers and colors, `9818071C` "New Frames Available", `28C2A532` "Expand Your Crew!", `5FB06D4C` and `2B1905B3` "New Difficulty Available", `11453713` `INF_DLG_GET_TRADE_UNLOCK_ITEM` "How to Get Special Crewmate Cards"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

`TU_AWEAPON_UPGRADE` sets bit 0 as `ShopWeaponLimitBreak` unlocks, in one write with `TU_AWEAPONLEAD` and the 8701 hashes `NOTE_WINDOW_TIPS_81` and `0x94E09A15`. `TUTORIAL_AWEAPON_UPGRADE` sets it later, on its own. `TUTORIAL_CHARATICKET` also moves with no window or tip beside it.

`TUTORIAL_PAD_ASSSGN`, `MultiPurposeId` `FirstControllerTypeSetting`, is taken as the interact and check mapping window by its timing and row, not by its text.

## Information dialogs

| Attribute | Name                       | Type   | Entities | Holds                              |
| --------- | -------------------------- | ------ | -------- | ---------------------------------- |
| 7301      | `INFORMATION_DIALOG_KEY`   | `uint` | 0-63     | Hash of an `infomation_dialog.Key` |
| 7302      | `INFORMATION_DIALOG_SHOWN` | `uint` | 0-63     | 1 once the dialog has shown        |

- All 20 `infomation_dialog` rows are held at entities 0-19, and the empty hash fills the rest.
- `infomation_dialog.DialogId` names a `dialog` row holding the title and body.
- 7302 goes from 0 to 1 at `DLG_SHOP_GET_CHARA_TICKET` with a Crewmate Card reward, and at the two rows with `QuestID` `00109001` just after that quest's first checkpoint.
- A save with both notices unmarked shows "New Memories Added" and "New Options Added" on returning to play.
