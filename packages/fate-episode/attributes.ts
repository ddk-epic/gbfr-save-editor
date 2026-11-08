import { Attribute, hashAttribute, keyTable } from "@gbfr/core";
import { FATE_EPISODE_KEYS } from "./data.gen";

export const FATE_EPISODES = keyTable("fate_episode", FATE_EPISODE_KEYS);

export const FATE_EPISODE_BITS = {
  locked: 1,
  started: 2,
  completed: 8,
  revealed: 16,
} as const;

export const FATE_EPISODE_KEY = hashAttribute(3501);
export const FATE_EPISODE_STATE = Attribute.flags(3502, FATE_EPISODE_BITS);
