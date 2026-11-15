import type { Context } from "./context";
import { loadMasterBadges } from "./badges";

export function genTrophy(ctx: Context) {
  const { db, emit, names } = ctx;
  const trophyNames = names.trophy;
  const { masterBadges, masterQuantities, accountMasterBadges } =
    loadMasterBadges(ctx);
  emit(
    "trophy",
    `/** badge Key and BehaviorId. */
export type BadgeRow = readonly [key: number, progress: number];

/** Master level and cap break badges by chara.CharId. */
export const MASTER_LEVEL_BADGES: Readonly<Record<string, readonly BadgeRow[]>> = {
${[...masterBadges]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(
    ([c, rows]) =>
      `  ${c}: [${rows.map((r) => `[${r.Key}, ${r.BehaviorId}]`).join(", ")}],`,
  )
  .join("\n")}
};

/** ReqQuantity per MASTER_LEVEL_BADGES row. */
export const MASTER_LEVEL_BADGE_QUANTITIES: readonly number[] = [${masterQuantities.join(", ")}];

/** Master level badges of no character, with ReqQuantity. */
export const ACCOUNT_MASTER_LEVEL_BADGES: readonly (readonly [
  key: number,
  progress: number,
  quantity: number,
])[] = [${accountMasterBadges.join(", ")}];`,
  );
  console.log(
    `MASTER_LEVEL_BADGES: ${masterBadges.size} characters, ${accountMasterBadges.length} account badges`,
  );

  // Unk9 5: level badges by BehaviorId, the lowest Key naming the character.
  const levelBadgeRows = db
    .prepare(
      "select CharaId, Key, BehaviorId, ReqQuantity from badge where Unk9 = 5 order by Key",
    )
    .all() as {
    CharaId: string;
    Key: number;
    BehaviorId: number;
    ReqQuantity: number;
  }[];
  const levelBehaviors = new Map<number, typeof levelBadgeRows>();
  for (const r of levelBadgeRows) {
    if (!levelBehaviors.has(r.BehaviorId)) levelBehaviors.set(r.BehaviorId, []);
    levelBehaviors.get(r.BehaviorId)!.push(r);
  }
  const levelBadges = [...levelBehaviors]
    .sort(([a], [b]) => a - b)
    .flatMap(([behavior, rows], index) => {
      const tiers = rows
        .sort((a, b) => a.ReqQuantity - b.ReqQuantity)
        .map((r) => `[${r.Key}, ${r.ReqQuantity}]`)
        .join(", ");
      const owner = rows.reduce((a, b) => (b.Key < a.Key ? b : a)).CharaId;
      return (owner === "PL0000" ? ["PL0000", "PL0100"] : [owner]).map(
        (c) =>
          `  ${c}: { index: ${index}, progress: ${behavior}, badges: [${tiers}] },`,
      );
    });
  const tierBadges = (behavior: number) =>
    (
      db
        .prepare(
          "select Key, ReqQuantity from badge where BehaviorId = ? order by ReqQuantity",
        )
        .all(behavior) as { Key: number; ReqQuantity: number }[]
    )
      .map((row) => `[${row.Key}, ${row.ReqQuantity}]`)
      .join(", ");
  emit(
    "trophy",
    `/** Level badges by chara.CharId: 5802 index, BehaviorId, badge.Key and ReqQuantity. */
export const CHARACTER_LEVEL_BADGES: Readonly<
  Record<
    string,
    {
      index: number;
      progress: number;
      badges: readonly (readonly [badge: number, quantity: number])[];
    }
  >
> = {
${levelBadges.join("\n")}
};

/** badge.Key and ReqQuantity of BehaviorId 219. */
export const CREW_LEVEL_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${tierBadges(219)}];

/** badge.Key and ReqQuantity of BehaviorId 1028. */
export const LAST_RAISED_LEVEL_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${tierBadges(1028)}];`,
  );
  console.log(`CHARACTER_LEVEL_BADGES: ${levelBadges.length} characters`);

  // Unk9 10 and 11: Collection and Trove. BehaviorId 184-186 and 998: weapon tiers.
  const characterBadges = (unk9: number) =>
    (
      db
        .prepare(
          "select CharaId, BehaviorId, Key, ReqQuantity from badge where Unk9 = ? order by CharaId",
        )
        .all(unk9) as {
        CharaId: string;
        BehaviorId: number;
        Key: number;
        ReqQuantity: number;
      }[]
    )
      .map(
        (row) =>
          `  ${row.CharaId}: [${row.BehaviorId}, ${row.Key}, ${row.ReqQuantity}],`,
      )
      .join("\n");
  const troveRows = characterBadges(11);
  const collectionRows = characterBadges(10);
  const weaponTierBadges = (behavior: number) =>
    (
      db
        .prepare(
          "select Key, ReqQuantity from badge where BehaviorId = ? order by Key",
        )
        .all(behavior) as { Key: number; ReqQuantity: number }[]
    )
      .map((row) => `[${row.Key}, ${row.ReqQuantity}]`)
      .join(", ");
  emit(
    "trophy",
    `/** Collection trophy by chara.CharId: BehaviorId, badge.Key and ReqQuantity. */
export const WEAPON_COLLECTIONS: Readonly<
  Record<
    string,
    readonly [progress: number, badge: number, quantity: number]
  >
> = {
${collectionRows}
};

/** Trove trophy by chara.CharId: BehaviorId, badge.Key and ReqQuantity. */
export const WEAPON_TROVES: Readonly<
  Record<
    string,
    readonly [progress: number, badge: number, quantity: number]
  >
> = {
${troveRows}
};

/** badge.Key and ReqQuantity of BehaviorId 184. */
export const WEAPONS_HELD_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${weaponTierBadges(184)}];

/** badge.Key and ReqQuantity of BehaviorId 998. */
export const WEAPONS_HELD_ALL_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${weaponTierBadges(998)}];

/** badge.Key and ReqQuantity of BehaviorId 185. */
export const WEAPON_LEVELS_TOTAL_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${weaponTierBadges(185)}];

/** badge.Key and ReqQuantity of BehaviorId 186. */
export const WEAPON_UNCAPS_BADGES: readonly (readonly [
  badge: number,
  quantity: number,
])[] = [${weaponTierBadges(186)}];`,
  );

  // Trophies: every `badge` row in SortOrder order, the order the journal lists.
  // No column names the tab. Each tab is a contiguous SortOrder block, base game
  // first and Endless Ragnarok after, so the tabs are cut at the first SortOrder
  // of each block. The blocks are in research/save-units.md.
  const TROPHY_TABS = [
    "story",
    "character",
    "battle",
    "gear",
    "conflux",
    "summons",
    "other",
  ] as const;
  const TROPHY_TAB_STARTS: [
    sortOrder: number,
    tab: (typeof TROPHY_TABS)[number],
  ][] = [
    [0, "story"],
    [134, "character"],
    [354, "battle"],
    [514, "gear"],
    [645, "other"],
    [819, "story"],
    [876, "character"],
    [1160, "battle"],
    [1207, "gear"],
    [1428, "conflux"],
    [1534, "summons"],
    [1568, "other"],
  ];
  const DLC_START = 819;
  const badges = db
    .prepare(
      "select Key, SortOrder, IsEndlessRagnarok as dlc, ReqQuantity from badge order by SortOrder, Key",
    )
    .all() as {
    Key: number;
    SortOrder: number;
    dlc: number;
    ReqQuantity: number;
  }[];
  for (const b of badges)
    if (b.SortOrder >= DLC_START !== (b.dlc === 1))
      throw new Error(
        `badge ${b.Key}: SortOrder ${b.SortOrder} and IsEndlessRagnarok ${b.dlc} disagree`,
      );
  const trophyTab = (sortOrder: number) =>
    [...TROPHY_TAB_STARTS].reverse().find(([start]) => start <= sortOrder)![1];
  emit(
    "trophy",
    `/** The journal's trophy tabs, base game and Endless Ragnarok together. */
export const TROPHY_TABS = ${JSON.stringify(TROPHY_TABS)} as const;

export type TrophyTab = (typeof TROPHY_TABS)[number];

/** \`badge\` rows in SortOrder order: Key, tab, IsEndlessRagnarok, and ReqQuantity, the
 * {0} of the descriptions that have one. ${badges.length} rows. */
export const TROPHIES: readonly (readonly [
  key: number,
  tab: TrophyTab,
  dlc: boolean,
  quantity: number,
])[] = [
${badges
  .map(
    (b) =>
      `  [${b.Key}, "${trophyTab(b.SortOrder)}", ${b.dlc === 1}, ${b.ReqQuantity}], // ${trophyNames[b.Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
  );
  console.log(
    `TROPHIES: ${badges.length} rows, ${badges.filter((b) => b.dlc).length} Endless Ragnarok`,
  );
}
