import { SAVE_ENTITY, SAVE_HASHSEED } from "../../packages/core/save-entity";
import { CAPTAIN } from "../../packages/character/attributes";
import { describe, expect, it } from "vitest";
import { apply } from "../helpers";
import { EMPTY_HASH } from "../../packages/core/keys";
import { hashId } from "../../packages/core/xxhash32-custom";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_STRIDE,
  TRAIT_WEAPON,
} from "../../packages/trait/attributes";
import {
  WEAPON_APPEARANCE,
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_TRAITS,
  WEAPON_TRAIT_POSITIONS,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "../../packages/weapon/attributes";
import {
  addWeapon,
  removeWeapon,
  removeWrightstone,
  setWeaponLevel,
} from "../../packages/weapon/edit";
import {
  findWeaponById,
  readOwnedWeapons,
  readWeapon,
} from "../../packages/weapon/read";
import { SaveSession } from "../../packages/core/session";
import {
  fixtureFile,
  unitStore,
  type EntityUnits,
} from "../../packages/gbfr-save-editor/testing";

const WEAPON = WEAPON_FIRST + 3;

describe("readWeapon", () => {
  it("gives one trait per position, empty or not", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_TRAITS, [hashId("SKILL_000_00"), EMPTY_HASH]],
      ],
    });
    const weapon = readWeapon(units, WEAPON)!;
    expect(weapon.key).toBe("WEP_PL0000_01");
    expect(weapon.traits).toEqual([
      "SKILL_000_00",
      ...Array(WEAPON_TRAIT_POSITIONS - 1).fill(undefined),
    ]);
  });

  it("reads no appearance for a weapon keeping its own look", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_APPEARANCE, EMPTY_HASH],
      ],
      [WEAPON + 1]: [
        [WEAPON_ID, 10],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_APPEARANCE, hashId("WEP_PL0000_02")],
      ],
    });
    expect(readWeapon(units, WEAPON)!.appearance).toBeUndefined();
    expect(readWeapon(units, WEAPON + 1)!.appearance).toBe("WEP_PL0000_02");
  });

  it("skips an entity whose id is 0 or whose key is empty", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 0],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
      ],
      [WEAPON + 1]: [
        [WEAPON_ID, 10],
        [WEAPON_KEY, EMPTY_HASH],
      ],
    });
    expect(readWeapon(units, WEAPON)).toBeUndefined();
    expect(readWeapon(units, WEAPON + 1)).toBeUndefined();
  });

  it("finds a weapon's entity by id", () => {
    const units = unitStore({ [WEAPON]: [[WEAPON_ID, 9]] });
    expect(findWeaponById(units, 9)).toBe(WEAPON);
    expect(findWeaponById(units, 10)).toBeUndefined();
  });

  it("reads the owner of a hash-keyed weapon from the table", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, 0x219ee448],
      ],
    });
    expect(readWeapon(units, WEAPON)).toEqual(
      expect.objectContaining({ key: "219EE448", character: "PL2900" }),
    );
  });
});

describe("readOwnedWeapons", () => {
  const weapon = (id: number, key: number, flags = 129): EntityUnits => [
    [WEAPON_ID, id],
    [WEAPON_KEY, key],
    [WEAPON_FLAGS, flags],
  ];
  const units = unitStore({
    [SAVE_ENTITY]: [[CAPTAIN, 1]],
    [WEAPON_FIRST]: weapon(1, hashId("WEP_PL2900_01")),
    [WEAPON_FIRST + 1]: weapon(2, 0x219ee448),
    [WEAPON_FIRST + 2]: weapon(3, hashId("WEP_PL2900_04"), 128),
    [WEAPON_FIRST + 5]: weapon(6, hashId("WEP_PL2900_A0")),
    [WEAPON_FIRST + 6]: weapon(7, hashId("WEP_PL0100_02")),
    [WEAPON_FIRST + 3]: weapon(4, hashId("WEP_PL0100_10")),
    [WEAPON_FIRST + 4]: weapon(5, hashId("WEP_NP0300_01")),
  });
  const owned = readOwnedWeapons(units);

  it("groups held Collection weapons by owner and series", () => {
    const ids = (character: string) =>
      [...(owned.get(character) ?? [])].map(([series, w]) => [series, w.id]);
    expect(ids("PL2900")).toEqual([
      [4, 1],
      [2, 2],
      [3, 3],
    ]);
    expect(owned.has("PL0100")).toBe(false);
  });

  it("leaves an NPC's weapon out", () => {
    expect(owned.has("NP0300")).toBe(false);
  });
});

describe("removeWrightstone", () => {
  const traitsOf = (weapon: number) =>
    TRAIT_FIRST + (TRAIT_WEAPON + weapon - WEAPON_FIRST) * TRAIT_STRIDE;
  const trait = (key: number, level: number): EntityUnits => [
    [TRAIT_KEY, key],
    [TRAIT_LEVEL, level],
  ];
  const stoned = (entity: number, id: number): Record<number, EntityUnits> => ({
    [entity]: [
      [WEAPON_ID, id],
      [WEAPON_KEY, hashId("WEP_PL0000_01")],
      [WEAPON_WRIGHTSTONE, hashId("ITEM_25_0131")],
    ],
    [traitsOf(entity)]: trait(hashId("SKILL_000_00"), 20),
    [traitsOf(entity) + 1]: trait(hashId("SKILL_001_00"), 15),
    [traitsOf(entity) + 2]: trait(hashId("SKILL_002_00"), 10),
  });

  it("empties the stone and its traits on that weapon only", () => {
    const session = SaveSession.open(
      fixtureFile({
        0: [[SAVE_HASHSEED, 7]],
        ...stoned(WEAPON, 9),
        ...stoned(WEAPON + 1, 10),
      }),
    );
    apply(session, (draft) => removeWrightstone(draft, 9));
    const units = session.save.slotData.units;
    expect(readWeapon(units, WEAPON)!.wrightstone).toBeUndefined();
    for (let i = 0; i < 3; i++) {
      expect(units.values(TRAIT_KEY, traitsOf(WEAPON) + i)).toEqual([
        EMPTY_HASH,
      ]);
      expect(units.values(TRAIT_LEVEL, traitsOf(WEAPON) + i)).toEqual([0]);
    }
    expect(readWeapon(units, WEAPON + 1)!.wrightstone).toEqual(
      expect.objectContaining({ key: "ITEM_25_0131" }),
    );
  });

  it("refuses a weapon without a stone", () => {
    const session = SaveSession.open(
      fixtureFile({
        [WEAPON]: [
          [WEAPON_ID, 9],
          [WEAPON_WRIGHTSTONE, EMPTY_HASH],
        ],
      }),
    );
    expect(() =>
      apply(session, (draft) => removeWrightstone(draft, 9)),
    ).toThrow("has no wrightstone");
    expect(() =>
      apply(session, (draft) => removeWrightstone(draft, 10)),
    ).toThrow("no weapon with id");
  });
});

describe("addWeapon", () => {
  const open = () =>
    SaveSession.open(
      fixtureFile({
        0: [
          [SAVE_HASHSEED, 7],
          [WEAPON_LAST_ID, 5],
        ],
        ...Object.fromEntries(
          [4, 0, 0].map((id, i): [number, EntityUnits] => [
            WEAPON_FIRST + i,
            [
              [WEAPON_ID, id],
              [WEAPON_KEY, hashId(id ? "WEP_PL0000_01" : "")],
              [WEAPON_XP, id ? 90 : 0],
              [WEAPON_UNCAP, id ? 1 : 0],
              [WEAPON_FLAGS, id ? 129 : 0],
            ],
          ]),
        ),
      }),
    );

  it("fills the first free entry under the next id", () => {
    const session = open();
    const added = apply(session, (draft) =>
      addWeapon(draft, "WEP_PL0100_03", {
        xp: 90,
        uncap: 2,
        flags: { forged: true },
      }),
    );
    expect(added).toEqual({ entity: WEAPON_FIRST + 1, id: 6 });
    const units = session.save.slotData.units;
    expect(units.of(0).get(WEAPON_LAST_ID)).toBe(6);
    const weapon = units.of(WEAPON_FIRST + 1);
    expect(weapon.get(WEAPON_ID)).toBe(6);
    expect(weapon.get(WEAPON_KEY)).toBe("WEP_PL0100_03");
    expect(weapon.get(WEAPON_XP)).toBe(90);
    expect(weapon.get(WEAPON_UNCAP)).toBe(2);
    expect(weapon.get(WEAPON_FLAGS)).toEqual(
      expect.objectContaining({ forged: true }),
    );
  });

  it("gives a second weapon in one draft the next entry and id", () => {
    const session = open();
    const [first, second] = apply(session, (draft) =>
      ["WEP_PL0100_03", "WEP_PL0200_03"].map((key) =>
        addWeapon(draft, key, { xp: 0, uncap: 0, flags: {} }),
      ),
    );
    expect(first).toEqual({ entity: WEAPON_FIRST + 1, id: 6 });
    expect(second).toEqual({ entity: WEAPON_FIRST + 2, id: 7 });
  });

  it("reuses an entry emptied in the same draft, and refuses a full list", () => {
    const session = open();
    apply(session, (draft) => {
      removeWeapon(draft, WEAPON_FIRST);
      expect(
        addWeapon(draft, "WEP_PL0100_03", { xp: 0, uncap: 0, flags: {} })
          .entity,
      ).toBe(WEAPON_FIRST);
    });
    expect(() =>
      apply(session, (draft) => {
        addWeapon(draft, "WEP_PL0200_03", { xp: 0, uncap: 0, flags: {} });
        addWeapon(draft, "WEP_PL0300_03", { xp: 0, uncap: 0, flags: {} });
        addWeapon(draft, "WEP_PL0400_03", { xp: 0, uncap: 0, flags: {} });
      }),
    ).toThrow("no free weapon entry");
  });
});

describe("removeWeapon and setWeaponLevel", () => {
  const open = () =>
    SaveSession.open(
      fixtureFile({
        [WEAPON]: [
          [WEAPON_ID, 9],
          [WEAPON_KEY, hashId("WEP_PL0000_01")],
          [WEAPON_XP, 90],
          [WEAPON_UNCAP, 1],
          [WEAPON_FLAGS, 129],
        ],
      }),
    );

  it("sets XP and uncap only", () => {
    const session = open();
    apply(session, (draft) => setWeaponLevel(draft, WEAPON, 1740, 3));
    const weapon = session.save.slotData.units.of(WEAPON);
    expect(weapon.get(WEAPON_XP)).toBe(1740);
    expect(weapon.get(WEAPON_UNCAP)).toBe(3);
    expect(weapon.get(WEAPON_ID)).toBe(9);
    expect(weapon.get(WEAPON_KEY)).toBe("WEP_PL0000_01");
  });

  it("empties the entry", () => {
    const session = open();
    apply(session, (draft) => removeWeapon(draft, WEAPON));
    const weapon = session.save.slotData.units.of(WEAPON);
    expect(weapon.get(WEAPON_ID)).toBe(0);
    expect(weapon.get(WEAPON_KEY)).toBeUndefined();
    expect(weapon.get(WEAPON_XP)).toBe(0);
    expect(weapon.get(WEAPON_UNCAP)).toBe(0);
    expect(session.save.slotData.units.values(WEAPON_FLAGS, WEAPON)).toEqual([
      0,
    ]);
  });
});
