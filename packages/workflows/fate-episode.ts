import { keyOf, hashId, SAVE_ENTITY } from "@gbfr/core";
import {
  FATE_EPISODE_CHARACTERS,
  FATE_EPISODE_REWARDS,
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
  FATE_EPISODES,
} from "@gbfr/fate-episode";
import type { Patch, SaveSession } from "@gbfr/core/session";
import { completeEpisode } from "@gbfr/fate-episode/edit";
import { ITEM_KEY } from "@gbfr/item";
import { acquisitions, rewardItem } from "@gbfr/item/edit";
import { unlockArchive } from "@gbfr/journal/edit";
import { FATE_QUEST_IDS } from "@gbfr/quest";
import { clearFateQuests } from "@gbfr/quest/edit";

/** Completes every episode of a character with its rewards, trophies excluded. */
export function completeFateEpisodes(session: SaveSession, character: string) {
  const units = session.save.slotData.units;

  const open = units.entitiesWith(FATE_EPISODE_KEY).filter((entity) => {
    const at = units.of(entity);
    const hash = at.get(FATE_EPISODE_KEY);
    return (
      hash !== undefined &&
      FATE_EPISODE_CHARACTERS[hash] === character &&
      !at.get(FATE_EPISODE_STATE).completed
    );
  });
  if (open.length === 0)
    throw new Error(`${character} has no fate episode left to complete`);

  const patches: Patch[] = [];
  const questIds = units.of(SAVE_ENTITY).get(FATE_QUEST_IDS);
  const questRows: number[] = [];
  const stamps = acquisitions(units);

  for (const entity of open) {
    const at = units.of(entity);
    patches.push(completeEpisode(units, entity));

    const key = keyOf(FATE_EPISODES, at.get(FATE_EPISODE_KEY));
    const reward = key === undefined ? undefined : FATE_EPISODE_REWARDS[key];
    if (reward?.quest !== undefined) {
      const row = questIds.indexOf(reward.quest);
      if (row === -1)
        throw new Error(`no fate quest ${reward.quest.toString(16)}`);
      questRows.push(row);
    }
    if (reward?.item !== undefined) {
      const item = units.onlyEntityWhere(ITEM_KEY, hashId(reward.item));
      patches.push(...rewardItem(units, stamps, item, !!reward.keyItem));
    }
    for (const archive of reward?.archives ?? [])
      patches.push(unlockArchive(units, archive));
  }

  if (questRows.length > 0) patches.push(clearFateQuests(units, questRows));
  patches.push(...stamps.done());
  session.patch(patches);
}
