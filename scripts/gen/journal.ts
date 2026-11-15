import type { Context } from "./context";

export function genJournal({ db, emit, names }: Context) {
  const storyNames = names.story;
  // Main Story order: every `story` row by chapter, the rows the chapter lists
  // first in their `Unk12` order, then its in-game events by key. The Story So Far
  // lists its `tt` rows, which carry no position; every other chapter lists the
  // rows with a position.
  const storyRows = db
    .prepare(
      "select Key, Unk10 as chapter, Unk12 as pos, Unk13 as kind from story",
    )
    .all() as { Key: string; chapter: number; pos: number; kind: number }[];
  const listed = (r: (typeof storyRows)[number]) =>
    r.chapter === 0 ? r.kind === 2 : r.pos !== 0;
  const storyOrder = [...storyRows].sort(
    (a, b) =>
      a.chapter - b.chapter ||
      Number(listed(b)) - Number(listed(a)) ||
      a.pos - b.pos ||
      a.Key.localeCompare(b.Key),
  );
  emit(
    "journal",
    `/** \`story\` keys in Main Story order, with the \`story_note_chapter\` key of each, ${storyOrder.length} rows. */
export const STORY_ORDER: readonly (readonly [key: string, chapter: number])[] = [
${storyOrder
  .map(
    (r) =>
      `  ["${r.Key}", ${r.chapter}], // ${listed(r) ? "" : "unlisted, "}${storyNames[r.Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
  );

  // The two Field Notes categories with no list of their own in the save. Weapons
  // and Treasure are read off the weapon and item units, so the rows each category
  // covers have to come from the tables. Both lists hold every row the category
  // draws from, the way Characters holds both captains: the Weapons counter of 154
  // then leaves out the captain not picked and the two Apocalypse weapons, and the
  // Treasure counter of 252 shows the 4 Curios as one.
  const fieldNoteWeapons = db
    .prepare(
      "select Key, CharaId from weapon where unk52 = 1 and (WeaponId is null or WeaponId = '') order by CharaId, Key",
    )
    .all() as { Key: string; CharaId: string }[];
  const fieldNoteTreasure = db
    .prepare(
      "select Key from item where SortOrder between 100 and 922 order by SortOrder",
    )
    .all() as { Key: string }[];
  const keyList = (rows: { Key: string }[]) =>
    rows.map((r) => `  ${JSON.stringify(r.Key)},`).join("\n");
  emit(
    "journal",
    `/** \`weapon\` keys the Field Notes Weapons category draws from, ${fieldNoteWeapons.length} rows. */
export const FIELD_NOTE_WEAPONS: readonly string[] = [
${keyList(fieldNoteWeapons)}
];

/** \`item\` keys the Field Notes Treasure category draws from, ${fieldNoteTreasure.length} rows in SortOrder order. */
export const FIELD_NOTE_TREASURE: readonly string[] = [
${keyList(fieldNoteTreasure)}
];`,
  );
  console.log(
    `FIELD_NOTE_WEAPONS: ${fieldNoteWeapons.length}, FIELD_NOTE_TREASURE: ${fieldNoteTreasure.length}`,
  );
}
