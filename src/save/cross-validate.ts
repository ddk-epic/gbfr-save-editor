import { CHARACTER_KEYS } from "../data/characters";
import type { SaveModule } from "../core/module";
import { warning, reject, type Graded } from "../core/validation";
import { characterOrder } from "../domains/character/read";
import { validateCurios } from "../domains/curio/validate";
import { validateFateEpisodes } from "../domains/fate-episode/validate";
import { validateItems } from "../domains/item/validate";
import { validateMasterTraits } from "../domains/master-trait/validate";
import { validateMasteries } from "../domains/mastery/validate";
import { validateOverMasteries } from "../domains/over-mastery/validate";
import { readProfile } from "../domains/profile/read";
import type { QuestIssue } from "../domains/quest/issues";
import { readCounterQuests, type CounterQuest } from "../domains/quest/read";
import { validateCounterQuests } from "../domains/quest/validate";
import { validateWrightstone } from "../domains/wrightstone/validate";
import type {
  CharacterDataIssue,
  InventoryIssue,
  QuestClearsMismatchIssue,
  SigilSlotClosedIssue,
} from "./issues";
import { readCharacterData, type CharacterData } from "./read-characters";
import { readInventory, type Inventory } from "./read-inventory";

const known = (key: string) => characterOrder(key) < Infinity;

export function validateCharacterData(
  data: CharacterData,
): Graded<CharacterDataIssue>[] {
  const issues: Graded<CharacterDataIssue>[] = [];
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
      ...closedSlots(name, "character", character.sigils, character.sigilSlots),
    );
  }
  const slots = new Map(
    data.characters.map((character) => [
      character.character,
      character.sigilSlots,
    ]),
  );
  for (const loadout of data.loadouts)
    issues.push(
      ...closedSlots(
        loadout.character,
        "loadout",
        loadout.sigils,
        slots.get(loadout.character) ?? 0,
      ),
    );
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

/** Sigils equipped past the open slots. */
const closedSlots = (
  character: string,
  where: string,
  sigils: readonly unknown[],
  slots: number,
): Graded<SigilSlotClosedIssue>[] =>
  sigils.flatMap((sigil, i) =>
    sigil !== undefined && i >= slots
      ? [
          reject({
            code: "sigilSlotClosed",
            character,
            where,
            position: i + 1,
            slots,
          }),
        ]
      : [],
  );

export function validateInventory(
  inventory: Inventory,
): Graded<InventoryIssue>[] {
  const { items } = inventory;
  const issues: Graded<InventoryIssue>[] = [
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

/** Quest clears against the profile's count. */
export function validateQuestClears(
  quests: CounterQuest[],
  profileClears: number,
): Graded<QuestClearsMismatchIssue>[] {
  const sum = quests.reduce((total, quest) => total + quest.clears, 0);
  return sum === profileClears
    ? []
    : [reject({ code: "questClearsMismatch", sum, profile: profileClears })];
}

export const characterModule: SaveModule<CharacterDataIssue> = {
  name: "characters",
  validate: (save) =>
    validateCharacterData(readCharacterData(save.slotData.units)),
};

export const inventoryModule: SaveModule<InventoryIssue> = {
  name: "inventory",
  validate: (save) => validateInventory(readInventory(save.slotData.units)),
};

export const counterQuestModule: SaveModule<
  QuestIssue | QuestClearsMismatchIssue
> = {
  name: "counter quests",
  validate(save, { now }) {
    const units = save.slotData.units;
    const quests = readCounterQuests(units);
    return [
      ...validateCounterQuests(quests, now),
      ...validateQuestClears(quests, readProfile(units).questsCleared),
    ];
  },
};
