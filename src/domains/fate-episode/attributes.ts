import { Attribute } from "../../core/attribute";
import { hashAttribute, keyTable } from "../../core/keys";
import { FATE_EPISODE_KEYS } from "../../data/characters";

export const FATE_EPISODES = keyTable("fate_episode", FATE_EPISODE_KEYS);

export const FATE_EPISODE_KEY = hashAttribute(3501);
export const FATE_EPISODE_STATE = Attribute.flags(3502, { completed: 8 });
