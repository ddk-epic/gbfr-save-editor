import {
  type Draft,
  addSigil,
  addWrightstone,
  editSigil,
  editWrightstone,
} from "gbfr-save-editor/edit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";
import { edit } from "../../state/actions";
import { go } from "../../state/navigation";
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
import { PageTop } from "../../ui/PageTop";
import { RowPanel } from "../../ui/RowPanel";
import type { SaveView, Table } from "../../view";
import { SIGILS_TABLE, WRIGHTSTONES_TABLE } from "../../view/shared";
import { TableMenu } from "../table-actions";
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
          table.actions && <TableMenu table={table} openAddForm={setAdding} />
        }
      />
    </>
  );
}
