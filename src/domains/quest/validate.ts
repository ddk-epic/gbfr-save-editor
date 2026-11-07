import { duplicates, reject, type Graded } from "../../core/validation";
import type { QuestIssue } from "./issues";
import type { SaveModule } from "../../core/module";
import { readSideQuests, type CounterQuest, type SideQuest } from "./read";

/** The game's release; no quest was cleared before it. */
export const RELEASE = new Date("2024-02-01");

export const validateSideQuests = (
  quests: SideQuest[],
): Graded<QuestIssue>[] => [
  ...duplicates(quests.map((quest) => quest.id)).map((id) =>
    reject({ code: "duplicateQuest", list: "side", id }),
  ),
  ...quests
    .filter((quest) => quest.completed && !quest.accepted)
    .map(({ id }) => reject({ code: "completedNotAccepted", id })),
];

export function validateCounterQuests(
  quests: CounterQuest[],
  now: Date,
): Graded<QuestIssue>[] {
  const issues: Graded<QuestIssue>[] = duplicates(
    quests.map((quest) => quest.id),
  ).map((id) => reject({ code: "duplicateQuest", list: "counter", id }));
  for (const { id, clears, lastCleared } of quests) {
    if (!lastCleared) continue;
    if (clears === 0)
      issues.push(reject({ code: "clearDateWithoutClear", id }));
    if (lastCleared < RELEASE || lastCleared > now)
      issues.push(
        reject({
          code: "clearDateOutOfRange",
          id,
          date: lastCleared.toISOString(),
        }),
      );
  }
  return issues;
}

export const sideQuestModule: SaveModule<QuestIssue> = {
  name: "side quests",
  validate: (save) => validateSideQuests(readSideQuests(save.slotData.units)),
};
