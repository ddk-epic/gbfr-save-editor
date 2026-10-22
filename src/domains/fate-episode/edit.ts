import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import { hashId } from "../../core/xxhash32-custom";
import {
  FATE_EPISODE_CHARACTERS,
  FATE_EPISODE_REWARDS,
} from "../../data/characters";
import type { Patch, SaveSession } from "../../session/save-session";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAG_BITS,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../item/attributes";
import { ARCHIVE_FLAGS, ARCHIVE_KEY } from "../journal/attributes";
import { FATE_QUEST_CLEARED, FATE_QUEST_IDS } from "../quest/attributes";
import { SAVE_ENTITY } from "../user/attributes";
import {
  FATE_EPISODE_BITS,
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
  FATE_EPISODES,
} from "./attributes";

const { locked, started, completed, revealed } = FATE_EPISODE_BITS;

/** Completes every episode of a character with its rewards, trophies excluded. */
export function completeFateEpisodes(session: SaveSession, character: string) {
  const units = session.save.slotData.units;
  const bits = (attribute: Patch["attribute"], entity: UnitEntity) =>
    (units.values(attribute, entity)?.[0] as number | undefined) ?? 0;
  const onlyEntity = (attribute: Patch["attribute"], key: string) => {
    const found = units.entitiesWhere(attribute, hashId(key));
    if (found.length !== 1)
      throw new Error(`${found.length} units hold ${key}`);
    return found[0]!;
  };

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
  const acquiredBefore = units.of(SAVE_ENTITY).get(ITEM_ACQUIRED_LAST);
  let acquired = acquiredBefore;

  for (const entity of open) {
    const state = bits(FATE_EPISODE_STATE, entity);
    // Locked episodes gain bit 4; open ones keep theirs.
    const reveal = state & locked ? revealed : state & revealed;
    patches.push({
      attribute: FATE_EPISODE_STATE,
      entity,
      values: [(state & ~locked) | started | completed | reveal],
    });

    const key = keyOf(FATE_EPISODES, units.of(entity).get(FATE_EPISODE_KEY));
    const reward = key === undefined ? undefined : FATE_EPISODE_REWARDS[key];
    if (reward?.quest !== undefined) {
      const index = questIds.indexOf(reward.quest);
      if (index === -1)
        throw new Error(`no fate quest ${reward.quest.toString(16)}`);
      cleared[index] = 1;
      questCleared = true;
    }
    if (reward?.item !== undefined) {
      const item = onlyEntity(ITEM_KEY, reward.item);
      const flags =
        ITEM_FLAG_BITS.fieldNote |
        (reward.keyItem ? ITEM_FLAG_BITS.keyItem : 0);
      patches.push(
        {
          attribute: ITEM_COUNT,
          entity: item,
          values: [units.of(item).get(ITEM_COUNT) + 1],
        },
        {
          attribute: ITEM_FLAGS,
          entity: item,
          values: [bits(ITEM_FLAGS, item) | flags],
        },
        { attribute: ITEM_ACQUIRED, entity: item, values: [++acquired] },
      );
    }
    for (const archive of reward?.archives ?? []) {
      const at = onlyEntity(ARCHIVE_KEY, archive);
      patches.push({
        attribute: ARCHIVE_FLAGS,
        entity: at,
        values: [bits(ARCHIVE_FLAGS, at) | 1],
      });
    }
  }

  if (questCleared)
    patches.push({
      attribute: FATE_QUEST_CLEARED,
      entity: SAVE_ENTITY,
      values: cleared,
    });
  if (acquired !== acquiredBefore)
    patches.push({
      attribute: ITEM_ACQUIRED_LAST,
      entity: SAVE_ENTITY,
      values: [acquired],
    });
  session.patch(patches);
}
