import { CHARACTER_KEYS } from "../data/characters";
import { warning, reject, type SaveIssue } from "../core/validation";
import { characterOrder } from "../domains/character/read";
import { validateCurios } from "../domains/curio/validate";
import { validateFateEpisodes } from "../domains/fate-episode/validate";
import { validateItems } from "../domains/item/validate";
import { validateMasterTraits } from "../domains/master-trait/validate";
import { validateMasteries } from "../domains/mastery/validate";
import { validateOverMasteries } from "../domains/over-mastery/validate";
import type { CounterQuest } from "../domains/quest/read";
import { validateWrightstone } from "../domains/wrightstone/validate";
import type { CharacterData } from "./characters";
import type { Inventory } from "./inventory";

const known = (key: string) => characterOrder(key) < Infinity;

export function validateCharacterData(data: CharacterData): SaveIssue[] {
  const issues: SaveIssue[] = [];
  const expected = Object.keys(CHARACTER_KEYS).length;
  if (data.characters.length !== expected)
    issues.push(
      warning({
        code: "tableCount",
        table: "chara",
        held: data.characters.length,
        expected,
      }),
    );
  for (const character of data.characters) {
    const name = character.character;
    issues.push(
      ...validateMasteries(name, character.masteries),
      ...validateMasterTraits(name, character.masterTraits),
      ...validateOverMasteries(name, character.overMasteries),
      ...validateFateEpisodes(name, character.fateEpisodes),
    );
  }
  for (const key of data.party)
    if (key !== undefined && !known(key))
      issues.push(warning({ code: "unknownCharacter", where: "party", key }));
  for (const loadout of data.loadouts)
    if (!known(loadout.character))
      issues.push(
        warning({
          code: "unknownCharacter",
          where: "loadout",
          key: loadout.character,
        }),
      );
  return issues;
}

export function validateInventory(inventory: Inventory): SaveIssue[] {
  const { items } = inventory;
  const issues = [
    ...validateItems(items, inventory.wishList),
    ...validateCurios(inventory.curios),
  ];
  for (const [list, keys] of [
    ["wishList", inventory.wishList],
    ["unseenItems", inventory.unseenItems],
  ] as const)
    for (const key of keys)
      if (!items.has(key))
        issues.push(warning({ code: "itemNotHeld", list, key }));
  for (const [id, stone] of inventory.wrightstones)
    issues.push(...validateWrightstone("wrightstone", id, stone));
  for (const [id, weapon] of inventory.weapons)
    if (weapon.wrightstone)
      issues.push(...validateWrightstone("weapon", id, weapon.wrightstone));
  return issues;
}

/** The profile counts the same clears from a different unit. */
export function validateQuestClears(
  quests: CounterQuest[],
  profileClears: number,
): SaveIssue[] {
  const sum = quests.reduce((total, quest) => total + quest.clears, 0);
  return sum === profileClears
    ? []
    : [reject({ code: "questClearsMismatch", sum, profile: profileClears })];
}
