import {
  completeFateEpisodes,
  maxCharacterLevel,
  maxMasterLevel,
  removeOverMasteries,
  unlockCharacter,
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
import { overMasteriesTable } from "../../view/shared";
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
  const { level, fateEpisodes, tables } = character;
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
          table.id === overMasteriesTable(character.key) && (
            <EditMenu
              actions={
                character.overMasteryRolled
                  ? [
                      {
                        label: t("edit.removeOverMasteries"),
                        run: () =>
                          edit((draft) =>
                            removeOverMasteries(draft, character.entity),
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
              count={level.rows.length + fateEpisodes.rows.length}
            >
              <div className="grid gap-4 pb-1 sm:grid-cols-2">
                <div className="min-w-0">
                  <LabeledTable
                    label={t("stats.level")}
                    table={level}
                    flush
                    menu={
                      <EditMenu
                        actions={[
                          ...(character.canUnlock
                            ? [
                                {
                                  label: gt("ui", "unlockCharacter")!,
                                  run: () =>
                                    edit((draft) =>
                                      unlockCharacter(draft, character.entity),
                                    ),
                                },
                              ]
                            : []),
                          ...(character.belowMaxLevel
                            ? [
                                {
                                  label: t("edit.maxCharacterLevel"),
                                  run: () =>
                                    edit((draft) =>
                                      maxCharacterLevel(
                                        draft,
                                        character.entity,
                                      ),
                                    ),
                                },
                              ]
                            : []),
                          ...(character.belowMaxMasterLevel
                            ? [
                                {
                                  label: t("edit.maxMasterLevel"),
                                  run: () =>
                                    edit((draft) =>
                                      maxMasterLevel(draft, character.entity),
                                    ),
                                },
                              ]
                            : []),
                        ]}
                      />
                    }
                  />
                </div>
                <div className="min-w-0">
                  <LabeledTable
                    label={t("stats.fateEpisodes")}
                    table={fateEpisodes}
                    flush
                    menu={
                      <EditMenu
                        actions={
                          character.fateEpisodesIncomplete
                            ? [
                                {
                                  label: t("edit.completeFateEpisodes"),
                                  run: () =>
                                    edit((draft) =>
                                      completeFateEpisodes(
                                        draft,
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
