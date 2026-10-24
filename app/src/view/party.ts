import type { CharacterData } from "gbfr-save-editor";
import { keyCell, trait } from "./cell";
import { table } from "./table";
import type { Cell, Table } from "./types";

/** The characters landing page's tables. */
export function buildParty(data: CharacterData): Table[] {
  return [
    table(
      "party:current",
      "party",
      [
        ["index", 2],
        ["character", 24],
        ["level", 5],
      ],
      data.party.map((key, i) => [
        i + 1,
        keyCell("character", key),
        data.characters.find((c) => c.character === key)?.level,
      ]),
      { stretch: "character", tab: "party", label: "currentParty" },
    ),
    table(
      "party:sets",
      "party",
      [
        ["set", 4],
        ["members", 60],
      ],
      data.partySets.flatMap((members, set): Cell[][] =>
        members
          ? [
              [
                set + 1,
                {
                  keys: members.flatMap((m) =>
                    m ? [{ text: "character", key: m.character }] : [],
                  ),
                  separator: ", ",
                },
              ],
            ]
          : [],
      ),
      { stretch: "members", tab: "party", label: "partySets" },
    ),
    table(
      "party:summons",
      "equippedSummons",
      [
        ["index", 2],
        ["summon", 36],
        ["trait", 36],
        ["equipBonus", 36],
      ],
      data.summons.map((s, i) => [
        i + 1,
        keyCell("summon", s?.key),
        trait(s?.trait),
        s?.equipBonus &&
          keyCell("summonBonus", s.equipBonus.key, s.equipBonus.level + 1),
      ]),
      { stretch: "summon" },
    ),
  ];
}
