# gbfr-save-editor

A save editor for Granblue Fantasy: Relink. Still work in progress and planned with the following features:

## Read

#### Save file

- [x] Container header: versions, section offsets and sizes, Steam ID
- [x] SystemData and SlotData FlatBuffers decode
- [x] Footer and the ten xxHash64 checksums, active checksum check
- [x] Validation report: reject checks, unknown versions, unresolved keys
- [x] Key tables resolve hashes to archive keys; unresolved keys show as `#` and hex
- [x] Game text in English and Japanese

#### User and system

- [x] Slot and feature version
- [x] Player name, commendations, online status flags
- [x] Current stage, spot and party HP
- [x] Play time

#### Profile

- [x] Quests cleared
- [x] Card characters: last played and most used, with level, quests used and master level
- [x] Recent players: name, player id, last seen, quest, grade, quests cleared and card characters

#### Party

- [x] Current party with equipment and skills
- [x] Party sets
- [x] Captain
- [x] Equipped summons

#### Items

- [x] Rupies and mastery points
- [x] Item counts by tab
- [x] Wish list, field note and seen flags

#### Sigils

- [x] Level, primary and secondary trait with levels
- [x] Locked and seen flags

#### Weapons

- [x] Owned weapons per character
- [x] XP, uncap, plus, awakening, transcendence, quests used
- [x] Weapon traits and applied wrightstone
- [x] Appearance, series, seen and awakening seen flags

#### Wrightstones

- [x] Inventory wrightstones with traits
- [x] Locked and seen flags

#### Summons

- [x] Trait and equip bonus with level and value
- [x] Ever equipped and seen flags

#### Curios

- [x] Curio tier and found number
- [x] Sigil reward: level, traits and seed

#### Conflux

- [x] Resonance points
- [x] Resonance nodes: cost, effects, taken
- [x] Auras: category, obtained and seen

#### Quests

- [x] Side quests: accepted and completed
- [x] Quest counter: difficulty, clears, best grade, last cleared, PWR

#### Journal

- [x] Main story with chapters
- [x] Archives, glossary, tips and music
- [x] Field notes by category

#### Trophies

- [x] Trophies by tab: DLC, quantity, earned and seen
- [ ] Trophy progress counts

#### Characters

- [x] Joined and playable characters
- [x] Level and master level
- [x] Fate episodes
- [x] Masteries: nodes, MSP, effects, taken, counts per series
- [x] Master traits: style, rank, perk, position, chosen, values
- [x] Over Masteries: line, level and value
- [x] Gear: weapon, sigils and skills per loadout
- [x] Unseen skills
- [ ] Learned skills

#### Tooling

- [x] Save diff, noise units hidden
- [x] Save Watch mod: live log of save unit changes
- [x] Live read checked against the save file

## Write

#### Session

- [x] In-place patching with checksum recompute
- [x] Export under the uploaded name
- [ ] Undo and reset
- [ ] Steam ID entry on export
- [ ] Export gated on legality

#### Characters

- [x] Complete fate episodes
- [x] Remove Over Mastery
- [ ] Edit Over Mastery: bonus and value per line
- [ ] Edit character level
- [ ] Edit master level
- [ ] Take or remove all offensive mastery nodes
- [ ] Take or remove all defensive mastery nodes
- [ ] Take or remove all base collection nodes
- [ ] Take or remove all transcendence collection nodes
- [ ] Set master trait cells
- [ ] Set skills per loadout
- [ ] Edit loadout gear: weapon and sigils per slot
- [ ] Switch captain between Gran and Djeeta
- [ ] Edit card stats: quests used

#### Weapons

- [x] Switch weapon
- [x] Remove wrightstone
- [ ] Apply wrightstone
- [ ] Upgrade weapon: uncap, plus, awakening, transcendence, or max all
- [ ] Unlock weapon
- [ ] Unlock weapon series
- [ ] Set appearance

#### Wrightstones

- [ ] Add wrightstone: traits and levels
- [ ] Edit wrightstone traits
- [ ] Lock or unlock
- [ ] Remove wrightstone

#### Sigils

- [ ] Add sigil: key, traits and level
- [ ] Edit sigil traits and level
- [ ] Max sigil level
- [ ] Lock or unlock
- [ ] Clear new mark
- [ ] Remove sigil

#### Items

- [ ] Set rupies and mastery points
- [ ] Max item count to its cap
- [ ] Max all items of a type
- [ ] Edit wish list

#### Summons

- [ ] Add summon: key, trait and equip bonus
- [ ] Edit summon trait and equip bonus level
- [ ] Max equip bonus
- [ ] Remove summon
- [ ] Set equipped summons

#### Conflux

- [ ] Take or remove all resonance nodes
- [ ] Set resonance points
- [ ] Unlock all auras

#### Quests

- [ ] Complete all side quests
- [ ] Set quest counter grade and clears

#### Journal

- [ ] Unlock all archives
- [ ] Unlock all glossary entries
- [ ] Unlock all tips
- [ ] Unlock all music
- [ ] Unlock all field notes

#### Trophies

- [ ] Earn all trophies

#### Profile

- [ ] Set player name
- [ ] Set commendations
- [ ] Set play time
