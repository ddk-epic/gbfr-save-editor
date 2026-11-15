import { DatabaseSync } from "node:sqlite";

export type DataFile =
  | "tables"
  | "character"
  | "conflux"
  | "fate-episode"
  | "item"
  | "journal"
  | "master-trait"
  | "mastery"
  | "over-mastery"
  | "quest"
  | "sigil"
  | "skill"
  | "summon"
  | "trait"
  | "trophy"
  | "weapon";

export const OUTPUT: Record<DataFile, string> = {
  tables: "packages/tables/data.gen.ts",
  character: "packages/character/data.gen.ts",
  conflux: "packages/conflux/data.gen.ts",
  "fate-episode": "packages/fate-episode/data.gen.ts",
  item: "packages/item/data.gen.ts",
  journal: "packages/journal/data.gen.ts",
  "master-trait": "packages/master-trait/data.gen.ts",
  mastery: "packages/mastery/data.gen.ts",
  "over-mastery": "packages/over-mastery/data.gen.ts",
  quest: "packages/quest/data.gen.ts",
  sigil: "packages/sigil/data.gen.ts",
  skill: "packages/skill/data.gen.ts",
  summon: "packages/summon/data.gen.ts",
  trait: "packages/trait/data.gen.ts",
  trophy: "packages/trophy/data.gen.ts",
  weapon: "packages/weapon/data.gen.ts",
};

/** The extractor writes a key it cannot name as its hash in 8 hex digits. */
export const UNNAMED_KEY = /^[0-9A-F]{8}$/;

/** English names of the game text, for the comments in the generated lists. */
export interface Names {
  quest: Record<string, string>;
  story: Record<string, string>;
  trophy: Record<string, string>;
}

export interface Context {
  db: DatabaseSync;
  textDir: string;
  /** Appends a block to a data file, in call order. */
  emit: (file: DataFile, block: string) => void;
  /** Filled by the text step, read by the domains that comment on names. */
  names: Names;
  /** Runs `make` once per key and returns its result to every caller. */
  load: <T>(key: string, make: () => T) => T;
}

export function createContext(dbPath: string, textDir: string) {
  const blocks = new Map<DataFile, string[]>();
  const loaded = new Map<string, unknown>();
  const ctx: Context = {
    db: new DatabaseSync(dbPath, { readOnly: true }),
    textDir,
    emit: (file, block) => {
      const list = blocks.get(file) ?? [];
      blocks.set(file, list);
      list.push(block);
    },
    names: { quest: {}, story: {}, trophy: {} },
    load: <T>(key: string, make: () => T) => {
      if (!loaded.has(key)) loaded.set(key, make());
      return loaded.get(key) as T;
    },
  };
  return { ctx, blocks };
}
