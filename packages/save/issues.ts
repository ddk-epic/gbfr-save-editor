import type {
  CoreFormatIssue,
  ContainerIssue,
  Graded,
  TableCountIssue,
} from "@gbfr/core";
import type { ConfluxIssue } from "@gbfr/conflux";
import type { CurioIssue } from "@gbfr/curio";
import type { FateEpisodeIssue } from "@gbfr/fate-episode";
import type { ItemIssue } from "@gbfr/item";
import type { JournalIssue } from "@gbfr/journal";
import type { MasterTraitIssue } from "@gbfr/master-trait";
import type { MasteryFormatIssue, MasteryIssue } from "@gbfr/mastery";
import type {
  OverMasteryFormatIssue,
  OverMasteryIssue,
} from "@gbfr/over-mastery";
import type { QuestIssue } from "@gbfr/quest";
import type { TrophyIssue } from "@gbfr/trophy";
import type { WrightstoneIssue } from "@gbfr/wrightstone";

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
