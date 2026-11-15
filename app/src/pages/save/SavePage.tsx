import { CHAPTER_ZERO_END_KEY, storyDifficulty } from "gbfr-save-editor";
import {
  type Draft,
  addSigil,
  addWrightstone,
  advanceStory,
  clearHints,
  maxAllWeaponSeries,
  unlockAllWeaponSeries,
  unlockAllCharacters,
  editSigil,
  editWrightstone,
  fillSkippedStory,
  maxMasteryPoints,
  maxRupies,
  maxTreasures,
} from "gbfr-save-editor/edit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";
import { edit } from "../../state/actions";
import { go } from "../../state/navigation";
import { useSave } from "../../state/save";
import {
  clearSelection,
  useSelectedRef,
  useSelection,
  type RowRef,
} from "../../state/selection";
import {
  ExpandCollapseActions,
  TableSections,
} from "../../tables/TableSections";
import { EditMenu } from "../../ui/EditMenu";
import { PageTop } from "../../ui/PageTop";
import { RowPanel } from "../../ui/RowPanel";
import type { SaveView, Table, TableLabelId } from "../../view";
import {
  OPTIONS_TABLE,
  PROFILE_TABLE,
  SIGILS_TABLE,
  STORY_TABLE,
  TREASURES_TABLE,
  WEAPONS_TABLE,
  WRIGHTSTONES_TABLE,
} from "../../view/shared";
import { SigilForm } from "./SigilForm";
import { WrightstoneForm } from "./WrightstoneForm";

type Editable = typeof WRIGHTSTONES_TABLE | typeof SIGILS_TABLE;

/** The row of `table` whose slot is `id`. */
const rowOf = (view: SaveView, table: Editable, id: number) => {
  const row = view.shared
    .find((t) => t.id === table)
    ?.rows.find((r) => r.edit?.id === id);
  return row && ({ tableId: table, rowId: row.id } satisfies RowRef);
};

/** Runs an add returning the new id, then selects its row. */
function add(table: Editable, run: (draft: Draft) => number) {
  let id = 0;
  edit(
    (draft) => {
      id = run(draft);
    },
    (view) => rowOf(view, table, id),
  );
}

const editRow = (table: Editable, id: number, run: (draft: Draft) => void) =>
  edit(run, (view) => rowOf(view, table, id));

/** A page of shared tables: the save, or the characters landing page. */
export function SavePage({
  fileName,
  title,
  tables,
  editable,
}: {
  fileName: string;
  title: string;
  tables: Table[];
  /** Offers the wrightstone and sigil edits. */
  editable?: boolean;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const selection = useSelection();
  const ref = useSelectedRef();
  const [adding, setAdding] = useState<Editable>();
  const belowMaxRupies = useSave((save) => save?.view.belowMaxRupies);
  const belowMaxMasteryPoints = useSave(
    (save) => save?.view.belowMaxMasteryPoints,
  );
  const canMaxItems = useSave((save) => save?.view.canMaxTreasures);
  const storyTargets = useSave((save) => save?.view.storyTargets);
  const canClear = useSave((save) => save?.view.canClearHints);
  const canUnlockAll = useSave((save) => save?.view.canUnlockAllCharacters);
  const canUnlockWeapons = useSave(
    (save) => save?.view.canUnlockAllWeaponSeries,
  );
  const canMaxWeapons = useSave((save) => save?.view.canMaxAllWeaponSeries);
  // Selecting a row leaves the add form.
  const [prevRef, setPrevRef] = useState(ref);
  if (ref !== prevRef) {
    setPrevRef(ref);
    setAdding(undefined);
  }

  const row = editable ? selection?.row : undefined;
  const rowEdit = row?.edit;
  const editor =
    adding === WRIGHTSTONES_TABLE ? (
      <WrightstoneForm
        key="add"
        applyLabel={t("edit.addWrightstone")}
        onApply={(roll) => {
          setAdding(undefined);
          add(WRIGHTSTONES_TABLE, (draft) => addWrightstone(draft, roll));
        }}
      />
    ) : adding === SIGILS_TABLE ? (
      <SigilForm
        key="add"
        applyLabel={t("edit.addSigil")}
        onApply={(roll) => {
          setAdding(undefined);
          add(SIGILS_TABLE, (draft) => addSigil(draft, roll));
        }}
      />
    ) : row && rowEdit?.kind === "wrightstone" ? (
      <WrightstoneForm
        key={row.id}
        initial={rowEdit.roll}
        applyLabel={gt("ui", "apply")}
        onApply={(roll) =>
          editRow(WRIGHTSTONES_TABLE, rowEdit.id, (draft) =>
            editWrightstone(draft, rowEdit.id, roll),
          )
        }
      />
    ) : row && rowEdit?.kind === "sigil" ? (
      <SigilForm
        key={row.id}
        initial={rowEdit.roll}
        applyLabel={gt("ui", "apply")}
        onApply={(roll) =>
          editRow(SIGILS_TABLE, rowEdit.id, (draft) =>
            editSigil(draft, rowEdit.id, roll),
          )
        }
      />
    ) : undefined;

  return (
    <>
      <PageTop
        crumbs={[fileName, title]}
        title={title}
        onRoot={() => go("welcome")}
        actions={
          <ExpandCollapseActions
            sections={tables.map((table) => table.section)}
          />
        }
      >
        <RowPanel
          selected={adding ? undefined : selection}
          editor={editor}
          heading={
            adding
              ? {
                  label: t("rowPanel.new"),
                  title:
                    adding === SIGILS_TABLE
                      ? t("equipment.sigil")
                      : t("equipment.wrightstone"),
                  section: adding,
                }
              : undefined
          }
          onClose={() => (adding ? setAdding(undefined) : clearSelection())}
        />
      </PageTop>
      <TableSections
        tables={tables}
        menuOf={(table) =>
          editable &&
          (table.id === WRIGHTSTONES_TABLE ? (
            <EditMenu
              actions={[
                {
                  label: t("edit.addWrightstone"),
                  run: () => setAdding(WRIGHTSTONES_TABLE),
                },
              ]}
            />
          ) : table.id === PROFILE_TABLE ? (
            <EditMenu
              actions={[
                ...(belowMaxRupies
                  ? [{ label: t("edit.maxRupies"), run: () => edit(maxRupies) }]
                  : []),
                ...(belowMaxMasteryPoints
                  ? [
                      {
                        label: t("edit.maxMasteryPoints"),
                        run: () => edit(maxMasteryPoints),
                      },
                    ]
                  : []),
                ...(canUnlockAll
                  ? [
                      {
                        label: t("edit.unlockAllCharacters"),
                        run: () => edit(unlockAllCharacters),
                      },
                    ]
                  : []),
              ]}
            />
          ) : table.id === STORY_TABLE ? (
            <EditMenu
              actions={(storyTargets ?? []).map(({ id, key, chapter }) => ({
                label: chapter
                  ? t("edit.advanceStory", {
                      chapter:
                        key === CHAPTER_ZERO_END_KEY
                          ? t("tables.chapterZeroEnd")
                          : gt("chapterStartChapter", String(key)),
                    })
                  : t(`tables.${id as TableLabelId}`),
                run: () =>
                  edit((draft, save) => {
                    advanceStory(draft, id, storyDifficulty(save));
                    fillSkippedStory(draft);
                  }),
              }))}
            />
          ) : table.id === OPTIONS_TABLE ? (
            <EditMenu
              actions={[
                ...(canClear
                  ? [
                      {
                        label: t("tables.clearHints"),
                        run: () => edit(clearHints),
                      },
                    ]
                  : []),
              ]}
            />
          ) : table.id === TREASURES_TABLE ? (
            <EditMenu
              actions={
                canMaxItems
                  ? [
                      {
                        label: t("edit.maxTreasures"),
                        run: () => edit(maxTreasures),
                      },
                    ]
                  : []
              }
            />
          ) : table.id === WEAPONS_TABLE ? (
            <EditMenu
              actions={[
                ...(canUnlockWeapons
                  ? [
                      {
                        label: t("edit.unlockAllWeapons"),
                        run: () => edit(unlockAllWeaponSeries),
                      },
                    ]
                  : []),
                ...(canMaxWeapons
                  ? [
                      {
                        label: t("edit.maxAllWeapons"),
                        run: () => edit(maxAllWeaponSeries),
                      },
                    ]
                  : []),
              ]}
            />
          ) : table.id === SIGILS_TABLE ? (
            <EditMenu
              actions={[
                {
                  label: t("edit.addSigil"),
                  run: () => setAdding(SIGILS_TABLE),
                },
              ]}
            />
          ) : undefined)
        }
      />
    </>
  );
}
