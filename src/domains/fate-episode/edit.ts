import { keyOf } from "../../core/keys";
import { hashId } from "../../core/xxhash32-custom";
import {
  FATE_EPISODE_CHARACTERS,
  FATE_EPISODE_REWARDS,
} from "../../data/characters";
import type { Patch, SaveSession } from "../../core/session";
import { ITEM_COUNT, ITEM_FLAGS, ITEM_KEY } from "../item/attributes";
import { acquisitions } from "../item/edit";
import { ARCHIVE_FLAGS, ARCHIVE_KEY } from "../journal/attributes";
import { FATE_QUEST_CLEARED, FATE_QUEST_IDS } from "../quest/attributes";
import { SAVE_ENTITY } from "../../core/save-entity";
import {
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
  FATE_EPISODES,
} from "./attributes";

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
  const cleared = [...units.of(SAVE_ENTITY).get(FATE_QUEST_CLEARED)];
  let questCleared = false;
  const stamps = acquisitions(units);

  for (const entity of open) {
    const at = units.of(entity);
    const state = at.get(FATE_EPISODE_STATE);
    // Locked episodes gain revealed; open ones keep theirs.
    patches.push(
      at.patch(FATE_EPISODE_STATE, {
        locked: false,
        started: true,
        completed: true,
        revealed: state.locked || state.revealed,
      }),
    );

    const key = keyOf(FATE_EPISODES, at.get(FATE_EPISODE_KEY));
    const reward = key === undefined ? undefined : FATE_EPISODE_REWARDS[key];
    if (reward?.quest !== undefined) {
      const index = questIds.indexOf(reward.quest);
      if (index === -1)
        throw new Error(`no fate quest ${reward.quest.toString(16)}`);
      cleared[index] = 1;
      questCleared = true;
    }
    if (reward?.item !== undefined) {
      const item = units.onlyEntityWhere(ITEM_KEY, hashId(reward.item));
      const held = units.of(item);
      patches.push(
        held.patch(ITEM_COUNT, held.get(ITEM_COUNT) + 1),
        held.patch(ITEM_FLAGS, {
          fieldNote: true,
          ...(reward.keyItem ? { keyItem: true } : {}),
        }),
        stamps.stamp(item),
      );
    }
    for (const archive of reward?.archives ?? []) {
      patches.push(
        units
          .of(units.onlyEntityWhere(ARCHIVE_KEY, hashId(archive)))
          .patch(ARCHIVE_FLAGS, { unlocked: true }),
      );
    }
  }

  if (questCleared)
    patches.push(units.of(SAVE_ENTITY).patch(FATE_QUEST_CLEARED, cleared));
  patches.push(...stamps.done());
  session.patch(patches);
}
