import {
  characterOrder,
  type CharacterData,
  type Equipment,
  type UnitStore,
} from "gbfr-save-editor";
import {
  CHARACTER_MAX_LEVEL,
  MAX_MASTER_LEVEL,
  characterLevels,
  characterMasterLevels,
  equippableWeapons,
} from "gbfr-save-editor/edit";
import { keyCell, trait } from "./cell";
import { table } from "./table";
import type { Cell, CharacterView, EquipmentSetView } from "./types";

const MASTER_TRAIT_TABS: Record<string, string> = {
  SB_DEF: "insight",
  SB_ATK: "essence",
  SB_LIMIT: "crux",
};

/** Each character's page, in roster order. */
export function buildCharacters(
  units: UnitStore,
  data: CharacterData,
): CharacterView[] {
  const equipmentSet = (
    id: string,
    name: string | undefined,
    e: Equipment & { skills: (string | undefined)[] },
    /** Open sigil slots. */
    slots: number,
    characterEntity?: number,
  ): EquipmentSetView => {
    const w = e.weapon;
    return {
      id,
      name,
      characterEntity,
      weaponOptions:
        characterEntity === undefined
          ? []
          : equippableWeapons(units, characterEntity).map(
              ({ id, key, series }) => ({
                id,
                key,
                series,
              }),
            ),
      weapon: table(
        `${id}:weapon`,
        "gear",
        [
          ["field", 12],
          ["value", 30],
        ],
        w
          ? [
              ["weapon", keyCell("weapon", w.key)],
              ["appearance", keyCell("weapon", w.appearance)],
              ["xp", w.xp],
              ["uncap", w.uncap],
              ["plus", w.plus],
              ["awakening", w.awakening],
              ["transcendence", w.transcendence],
              ...w.traits.map((key, i): Cell[] => [
                `trait ${i + 1}`,
                keyCell("trait", key),
              ]),
              ["quests used", w.questsUsed],
            ]
          : [],
        { stretch: "value" },
      ),
      wrightstoneWeaponId: w?.wrightstone ? w.id : undefined,
      wrightstone: table(
        `${id}:wrightstone`,
        "gear",
        [
          ["field", 12],
          ["value", 30],
        ],
        [
          ["wrightstone", keyCell("item", w?.wrightstone?.key)],
          ["main", trait(w?.wrightstone?.traits[0])],
          ["sub 1", trait(w?.wrightstone?.traits[1])],
          ["sub 2", trait(w?.wrightstone?.traits[2])],
        ],
        { stretch: "value" },
      ),
      skills: table(
        `${id}:skills`,
        "gear",
        [
          ["slot", 4],
          ["skill", 40],
        ],
        e.skills.map((key, i) => [i + 1, keyCell("skill", key)]),
        { stretch: "skill" },
      ),
      sigils: table(
        `${id}:sigils`,
        "gear",
        [
          ["slot", 4],
          ["sigil", 36],
          ["level", 6],
          ["primary", 32],
          ["secondary", 32],
          ["locked", 6],
          ["new", 3],
        ],
        e.sigils.flatMap((s, i): Cell[][] =>
          i < slots || s
            ? [
                [
                  i + 1,
                  keyCell("sigil", s?.key),
                  s?.level,
                  keyCell("trait", s?.primaryTrait?.key),
                  keyCell("trait", s?.secondaryTrait?.key),
                  s?.locked,
                  s && !s.seen,
                ],
              ]
            : [],
        ),
        { stretch: "sigil" },
      ),
    };
  };

  return [...data.characters]
    .sort((a, b) => characterOrder(a.character) - characterOrder(b.character))
    .map((c): CharacterView => ({
      key: c.character,
      entity: c.entity,
      level: c.level,
      belowMaxLevel:
        characterLevels(c.character) && c.level < CHARACTER_MAX_LEVEL,
      belowMaxMasterLevel:
        characterMasterLevels(c.character) && c.masterLevel < MAX_MASTER_LEVEL,
      overMasteryRolled: c.overMasteries.some((o) => o !== undefined),
      fateEpisodesIncomplete: c.fateEpisodes.some((f) => !f.completed),
      tables: [
        table(
          `${c.character}:level`,
          "stats",
          [
            ["field", 32],
            ["value", 14],
          ],
          [
            ["level", c.level],
            ["xp", c.xp],
            ["base HP", c.baseHp],
            ["base ATK", c.baseAttack],
            ["quests used", c.questsUsed],
            ["master level", c.masterLevel],
            ["master XP", c.masterXp],
          ],
          { stretch: "field" },
        ),
        table(
          `${c.character}:fateEpisodes`,
          "stats",
          [
            ["episode", 40],
            ["completed", 10],
          ],
          c.fateEpisodes.map((f) => [
            keyCell("fateEpisode", f.key),
            f.completed,
          ]),
          { stretch: "episode" },
        ),
        table(
          `${c.character}:masteries`,
          "masteries",
          [
            ["tree", 20],
            ["nodes", 10],
            ["msp", 8],
          ],
          Object.entries(c.masteries).map(([section, m]) => [
            section,
            `${m.taken}/${m.total}`,
            m.msp,
          ]),
          { stretch: "tree", tab: "all", label: "summary" },
        ),
        table(
          `${c.character}:overMasteries`,
          "masteries",
          [
            ["index", 2],
            ["bonus", 40],
            ["level", 5],
          ],
          c.overMasteries.map((o, i) => [
            i + 1,
            keyCell("mastery", o?.key),
            o?.level,
          ]),
          { stretch: "bonus", tab: "all", label: "overMasteries" },
        ),
        ...Object.entries(c.masteries).map(([section, m]) =>
          table(
            `${c.character}:masteries:${section}`,
            "masteries",
            [
              ["node", 32],
              ["effect", 60],
              ["msp", 6],
              ["taken", 5],
            ],
            m.nodes.map((n): Cell[] => [
              keyCell("masteryNode", n.key),
              n.params.length
                ? {
                    keys: n.params.map((p) => ({
                      text: "masteryEffect",
                      key: p.key,
                      values:
                        p.bonus === undefined ? [p.value] : [p.value, p.bonus],
                    })),
                    separator: " / ",
                  }
                : undefined,
              n.msp,
              n.taken,
            ]),
            { stretch: "effect", tab: section },
          ),
        ),
        ...Object.entries(MASTER_TRAIT_TABS).map(([style, tab]) =>
          table(
            `${c.character}:masterTraits:${tab}`,
            "masterTraits",
            [
              ["rank", 10],
              ["trait", 36],
              ["chosen", 6],
            ],
            c.masterTraits
              .filter((t) => t.style === style)
              .map((t): Cell[] => [
                t.perk ? `${t.rank} perk` : t.rank,
                {
                  text: "masterTrait",
                  key: t.key,
                  values: t.values.map((v, i) => v * (t.valueScales[i] ?? 1)),
                },
                t.chosen,
              ]),
            { stretch: "trait", tab },
          ),
        ),
      ],
      equipment: [
        equipmentSet(
          `${c.character}:equipped`,
          undefined,
          c,
          c.sigilSlots,
          c.entity,
        ),
        ...data.loadouts
          .filter((l) => l.character === c.character)
          .map((l, i) =>
            equipmentSet(
              `${c.character}:loadout:${i}`,
              l.name,
              l,
              c.sigilSlots,
            ),
          ),
        ...data.partySets.flatMap((members, set) =>
          (members ?? [])
            .filter((m) => m?.character === c.character)
            .map((m) => ({
              ...equipmentSet(
                `${c.character}:partySet:${set}`,
                undefined,
                m!,
                c.sigilSlots,
              ),
              partySet: set + 1,
            })),
        ),
      ],
    }));
}
