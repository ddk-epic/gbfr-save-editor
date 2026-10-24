import {
  addWrightstone,
  editWrightstone,
  wrightstoneRoll,
  wrightstoneSubs,
  WRIGHTSTONE_MAINS,
  type WrightstoneFamily,
  type WrightstoneRoll,
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
import { EditMenu } from "../../ui/EditMenu";
import { PageTop } from "../../ui/PageTop";
import { RowPanel } from "../../ui/RowPanel";
import type { KeyCell, Row, SaveView, Table } from "../../view";
import { WrightstoneForm } from "./WrightstoneForm";

/** The form's starting values for a stone row. */
function rollOf(row: Row): Partial<WrightstoneRoll> {
  const [, stone, ...traits] = row.cells as [
    unknown,
    KeyCell,
    ...(KeyCell | undefined)[],
  ];
  const roll = wrightstoneRoll(
    stone.key,
    traits
      .slice(0, 3)
      .flatMap((t) =>
        t ? [{ entity: 0, key: t.key, level: t.level ?? 0 }] : [],
      ),
  );
  if (roll) return roll;
  const family = Number(
    /^ITEM_(\d+)_/.exec(stone.key)?.[1],
  ) as WrightstoneFamily;
  if (!(family in WRIGHTSTONE_MAINS)) return {};
  const allowed = wrightstoneSubs(family);
  const sub = (t: KeyCell | undefined) =>
    t && allowed.includes(t.key) ? t.key : "";
  return { family, subs: [sub(traits[1]), sub(traits[2])] };
}

/** The wrightstones table row of stone `id`. */
const stoneRow = (view: SaveView, id: number): RowRef | undefined => {
  const row = view.shared
    .find((t) => t.id === "wrightstones")
    ?.rows.find((r) => r.cells[0] === id);
  return row && { tableId: "wrightstones", rowId: row.id };
};

function addStone(roll: WrightstoneRoll) {
  let id = 0;
  edit(
    (session) => {
      id = addWrightstone(session, roll);
    },
    (view) => stoneRow(view, id),
  );
}

const editStone = (id: number, roll: WrightstoneRoll) =>
  edit(
    (session) => editWrightstone(session, id, roll),
    (view) => stoneRow(view, id),
  );

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
  /** Offers the wrightstone edits. */
  editable?: boolean;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const selection = useSelection();
  const ref = useSelectedRef();
  const [adding, setAdding] = useState(false);
  // Selecting a row leaves the add form.
  const [prevRef, setPrevRef] = useState(ref);
  if (ref !== prevRef) {
    setPrevRef(ref);
    setAdding(false);
  }

  const stone =
    selection?.table.id === "wrightstones" ? selection.row : undefined;
  const editor = adding ? (
    <WrightstoneForm
      key="add"
      applyLabel={t("edit.addWrightstone")}
      onApply={(roll) => {
        setAdding(false);
        addStone(roll);
      }}
    />
  ) : stone && editable ? (
    <WrightstoneForm
      key={stone.id}
      initial={rollOf(stone)}
      applyLabel={gt("ui", "apply")}
      onApply={(roll) => editStone(stone.cells[0] as number, roll)}
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
                  title: t("equipment.wrightstone"),
                  section: "wrightstones",
                }
              : undefined
          }
          onClose={() => (adding ? setAdding(false) : clearSelection())}
        />
      </PageTop>
      <TableSections
        tables={tables}
        menuOf={(table) =>
          table.id === "wrightstones" &&
          editable && (
            <EditMenu
              actions={[
                { label: t("edit.addWrightstone"), run: () => setAdding(true) },
              ]}
            />
          )
        }
      />
    </>
  );
}
