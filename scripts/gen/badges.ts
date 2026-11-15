import type { Context } from "./context";

/** Master level badges per character, shared by the character and trophy tables. */
export function loadMasterBadges({ db, load }: Context) {
  return load("masterBadges", () => {
    // Unk9 19 to 21: master level, cap break and last break badges. PL0000 for both captains.
    const masterBadgeRows = db
      .prepare(
        `select CharaId, Key, BehaviorId, ReqQuantity from badge
     where Unk9 in (19, 20, 21) order by Key`,
      )
      .all() as {
      CharaId: string;
      Key: number;
      BehaviorId: number;
      ReqQuantity: number;
    }[];
    const masterBadges = new Map<string, typeof masterBadgeRows>();
    for (const r of masterBadgeRows)
      for (const character of r.CharaId === "PL0000"
        ? ["PL0000", "PL0100"]
        : [r.CharaId]) {
        if (!masterBadges.has(character)) masterBadges.set(character, []);
        masterBadges.get(character)!.push(r);
      }
    const masterQuantities = [...masterBadges.values()][0]!.map(
      (r) => r.ReqQuantity,
    );
    for (const [character, rows] of masterBadges)
      if (rows.map((r) => r.ReqQuantity).join() !== masterQuantities.join())
        throw new Error(`${character}: master badge ReqQuantity differs`);
    const accountMasterBadges = (
      db
        .prepare(
          "select Key, BehaviorId, ReqQuantity from badge where Key in (846, 1464, 1465) order by Key",
        )
        .all() as { Key: number; BehaviorId: number; ReqQuantity: number }[]
    ).map((r) => `[${r.Key}, ${r.BehaviorId}, ${r.ReqQuantity}]`);
    return { masterBadges, masterQuantities, accountMasterBadges };
  });
}
