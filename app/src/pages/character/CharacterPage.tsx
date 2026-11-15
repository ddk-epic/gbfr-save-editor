import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";
import { go } from "../../state/navigation";
import { clearSelection, useSelection } from "../../state/selection";
import { LabeledTable } from "../../tables/SelectableTable";
import {
  CollapsibleSection,
  ExpandCollapseActions,
  TableSections,
} from "../../tables/TableSections";
import { PageTop } from "../../ui/PageTop";
import { RowPanel } from "../../ui/RowPanel";
import type { CharacterView } from "../../view";
import { TableMenu } from "../table-actions";
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
        menuOf={(table) => table.actions && <TableMenu table={table} />}
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
                    menu={<TableMenu table={level} />}
                  />
                </div>
                <div className="min-w-0">
                  <LabeledTable
                    label={t("stats.fateEpisodes")}
                    table={fateEpisodes}
                    flush
                    menu={<TableMenu table={fateEpisodes} />}
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
