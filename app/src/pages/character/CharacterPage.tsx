import {
  completeFateEpisodes,
  maxCharacterLevel,
  removeOverMasteries,
} from "gbfr-save-editor/edit";
import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";
import { edit } from "../../state/actions";
import { go } from "../../state/navigation";
import { clearSelection, useSelection } from "../../state/selection";
import { LabeledTable } from "../../tables/SelectableTable";
import {
  CollapsibleSection,
  ExpandCollapseActions,
  TableSections,
} from "../../tables/TableSections";
import { EditMenu } from "../../ui/EditMenu";
import { PageTop } from "../../ui/PageTop";
import { RowPanel } from "../../ui/RowPanel";
import type { CharacterView } from "../../view";
import { EquipmentSets } from "./EquipmentSets";

export function CharacterPage({
  fileName,
  character,
}: {
  fileName: string;
  character: CharacterView;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const selection = useSelection();
  const name = gt("character", character.key) ?? character.key;
  const [level, fateEpisodes] = character.tables.filter(
    (table) => table.section === "stats",
  );
  const tables = character.tables.filter((table) => table.section !== "stats");
  const sections: string[] = [
    "stats",
    "gear",
    ...tables.map((table) => table.section),
  ];

  return (
    <>
      <PageTop
        crumbs={[fileName, t("contents.characters"), name]}
        title={name}
        onRoot={() => go("welcome")}
        actions={<ExpandCollapseActions sections={sections} />}
      >
        <RowPanel selected={selection} onClose={clearSelection} />
      </PageTop>
      <TableSections
        tables={tables}
        menuOf={(table) =>
          table.id === `${character.key}:overMasteries` && (
            <EditMenu
              actions={
                character.overMasteryRolled
                  ? [
                      {
                        label: t("edit.removeOverMasteries"),
                        run: () =>
                          edit((session) =>
                            removeOverMasteries(session, character.entity),
                          ),
                      },
                    ]
                  : []
              }
            />
          )
        }
        before={
          <>
            <CollapsibleSection
              section="stats"
              count={level!.rows.length + fateEpisodes!.rows.length}
            >
              <div className="grid gap-4 pb-1 sm:grid-cols-2">
                <div className="min-w-0">
                  <LabeledTable
                    label={t("stats.level")}
                    table={level!}
                    flush
                    menu={
                      <EditMenu
                        actions={
                          character.belowMaxLevel
                            ? [
                                {
                                  label: t("edit.maxCharacterLevel"),
                                  run: () =>
                                    edit((session) =>
                                      maxCharacterLevel(
                                        session,
                                        character.entity,
                                      ),
                                    ),
                                },
                              ]
                            : []
                        }
                      />
                    }
                  />
                </div>
                <div className="min-w-0">
                  <LabeledTable
                    label={t("stats.fateEpisodes")}
                    table={fateEpisodes!}
                    flush
                    menu={
                      <EditMenu
                        actions={
                          character.fateEpisodesIncomplete
                            ? [
                                {
                                  label: t("edit.completeFateEpisodes"),
                                  run: () =>
                                    edit((session) =>
                                      completeFateEpisodes(
                                        session,
                                        character.key,
                                      ),
                                    ),
                                },
                              ]
                            : []
                        }
                      />
                    }
                  />
                </div>
              </div>
            </CollapsibleSection>
            <CollapsibleSection
              section="gear"
              count={character.equipment.length}
            >
              <EquipmentSets sets={character.equipment} />
            </CollapsibleSection>
          </>
        }
      />
    </>
  );
}
