import type { CoreFormatIssue } from "../core/errors";
import type { ContainerIssue } from "../core/validate-container";
import type { Graded, TableCountIssue } from "../core/validation";
import type { ConfluxIssue } from "../domains/conflux/issues";
import type { CurioIssue } from "../domains/curio/issues";
import type { FateEpisodeIssue } from "../domains/fate-episode/issues";
import type { ItemIssue } from "../domains/item/issues";
import type { JournalIssue } from "../domains/journal/issues";
import type { MasterTraitIssue } from "../domains/master-trait/issues";
import type {
  MasteryFormatIssue,
  MasteryIssue,
} from "../domains/mastery/issues";
import type {
  OverMasteryFormatIssue,
  OverMasteryIssue,
} from "../domains/over-mastery/issues";
import type { QuestIssue } from "../domains/quest/issues";
import type { TrophyIssue } from "../domains/trophy/issues";
import type { WrightstoneIssue } from "../domains/wrightstone/issues";

/** A sigil equipped past the character's open slots; position counts from 1. */
export type SigilSlotClosedIssue = {
  code: "sigilSlotClosed";
  character: string;
  where: string;
  position: number;
  slots: number;
};

export type UnknownCharacterIssue = {
  code: "unknownCharacter";
  where: string;
  key: string;
};

/** An item list naming an item the inventory does not hold. */
export type ItemNotHeldIssue = {
  code: "itemNotHeld";
  list: string;
  key: string;
};

/** Counter quest clears that do not add up to the profile's count. */
export type QuestClearsMismatchIssue = {
  code: "questClearsMismatch";
  sum: number;
  profile: number;
};

export type CharacterDataIssue =
  | TableCountIssue
  | MasteryIssue
  | MasterTraitIssue
  | OverMasteryIssue
  | FateEpisodeIssue
  | SigilSlotClosedIssue
  | UnknownCharacterIssue;

export type InventoryIssue =
  ItemIssue | CurioIssue | ItemNotHeldIssue | WrightstoneIssue;

/** A claim every save the game writes holds, found broken. */
export type ValidationIssue =
  | ContainerIssue
  | CharacterDataIssue
  | InventoryIssue
  | ConfluxIssue
  | TrophyIssue
  | QuestIssue
  | QuestClearsMismatchIssue
  | JournalIssue;

export type ValidationCode = ValidationIssue["code"];

export type SaveFormatIssue =
  CoreFormatIssue | MasteryFormatIssue | OverMasteryFormatIssue;

export type SaveFormatCode = SaveFormatIssue["code"];

/** A problem found in a save, format error or broken claim, and how much it matters. */
export type SaveIssue = Graded<SaveFormatIssue | ValidationIssue>;
