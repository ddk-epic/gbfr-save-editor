import type { Context } from "./context";

export function genQuest({ db, emit, names }: Context) {
  const questNames = names.quest;
  // Quest counter list: every quest whose row carries a counter flag, in the
  // order the tables give, difficulty then advised PWR then id. That is close to
  // the counter's own order but not it: within one power band the counter has an
  // order of its own that no column or table row order explains, and Maniac lists
  // two quests outside their band. Difficulty is the id's fifth digit, 1 to B.
  const DIFFICULTIES = [
    "easy",
    "normal",
    "hard",
    "very hard",
    "extreme",
    "maniac",
    "proud",
    "chaos",
    "chaos+",
    "chaos++",
    "infinity",
  ];
  /** Unk25 on a quest the counter lists. A quest id it never fills holds 0. */
  const COUNTER_FLAGS = [102, 103, 110];
  /** Gulp... So These Are the Rumored Monsters, listed but carrying no flag. */
  const UNFLAGGED_COUNTER_QUEST = "00405308";
  const questRows = db
    .prepare("select Key, AdvisedPWR, Unk25 from quest_baseinfo_ex_data")
    .all() as { Key: string; AdvisedPWR: number; Unk25: number }[];
  const counterQuests = questRows
    .filter(
      (r) =>
        /^0040[1-9AB]/.test(r.Key) &&
        r.AdvisedPWR > 0 &&
        (COUNTER_FLAGS.includes(r.Unk25) || r.Key === UNFLAGGED_COUNTER_QUEST),
    )
    .sort(
      (a, b) =>
        parseInt(a.Key[4]!, 16) - parseInt(b.Key[4]!, 16) ||
        a.AdvisedPWR - b.AdvisedPWR ||
        a.Key.localeCompare(b.Key),
    );
  emit(
    "quest",
    `/** Quest id and quest_baseinfo_ex_data.AdvisedPWR, in quest counter order, ${counterQuests.length} quests. */
export const QUEST_COUNTER: readonly (readonly [id: string, pwr: number])[] = [
${counterQuests
  .map(
    ({ Key, AdvisedPWR }) =>
      `  ["${Key}", ${AdvisedPWR}], // ${DIFFICULTIES[parseInt(Key[4]!, 16) - 1] ?? "?"} ${questNames[Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
  );
  console.log(
    `QUEST_COUNTER: ${counterQuests.length} quests, ${counterQuests.filter((r) => !questNames[r.Key]).length} unnamed`,
  );
}
