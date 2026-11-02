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
