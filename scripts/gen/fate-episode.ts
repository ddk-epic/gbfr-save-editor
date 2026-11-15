import { hashId } from "../../packages/core/xxhash32-custom";
import { UNNAMED_KEY, type Context } from "./context";

export function genFateEpisode({ db, emit }: Context) {
  // Fate episode owner by fate_episode key, for the episodes the menu lists.
  // REMI_* rows have no FateMissionTitle and never show.
  const episodes = (
    db
      .prepare(
        "select Key, CharaId from fate_episode where FateMissionTitle <> ''",
      )
      .all() as {
      Key: string;
      CharaId: string;
    }[]
  ).map(
    ({ Key, CharaId }) =>
      `  0x${(UNNAMED_KEY.test(Key) ? parseInt(Key, 16) : hashId(Key)).toString(16).padStart(8, "0")}: ${JSON.stringify(CharaId)},`,
  );
  emit(
    "fate-episode",
    `/** fate_episode.CharaId by fate_episode key, ${episodes.length} titled episodes. */
export const FATE_EPISODE_CHARACTERS: Readonly<Record<number, string>> = {
${episodes.sort().join("\n")}
};`,
  );

  // Grants the quest clear, item and archives on completing an episode.
  const rewards = (
    db
      .prepare(
        `select f.Key, f.MissionQuestId quest, f.ItemReward item, i.ItemCategoryId category,
         f.StoryNoteArchiveId1 archive1, f.StoryNoteArchiveId2 archive2
       from fate_episode f left join item i on i.Key = f.ItemReward
       where f.FateMissionTitle <> '' and (f.MissionQuestId <> '00000000' or f.ItemReward <> ''
         or f.StoryNoteArchiveId1 <> '' or f.StoryNoteArchiveId2 <> '')`,
      )
      .all() as {
      Key: string;
      quest: string;
      item: string;
      category: number | null;
      archive1: string;
      archive2: string;
    }[]
  ).map((row) => {
    const fields = [
      row.quest !== "00000000" && `quest: 0x${row.quest}`,
      row.item !== "" &&
        `item: ${JSON.stringify(row.item)}, keyItem: ${row.category === 14}`,
      (row.archive1 !== "" || row.archive2 !== "") &&
        `archives: ${JSON.stringify([row.archive1, row.archive2].filter((a) => a !== ""))}`,
    ].filter(Boolean);
    return `  ${JSON.stringify(row.Key)}: { ${fields.join(", ")} },`;
  });
  emit(
    "fate-episode",
    `/** Completion rewards by fate_episode.Key, ${rewards.length} episodes; keyItem is ItemCategoryId 14. */
export const FATE_EPISODE_REWARDS: Readonly<
  Record<
    string,
    {
      quest?: number;
      item?: string;
      keyItem?: boolean;
      archives?: readonly string[];
    }
  >
> = {
${rewards.sort().join("\n")}
};`,
  );
}
