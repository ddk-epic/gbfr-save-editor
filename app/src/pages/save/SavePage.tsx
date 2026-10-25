import {
  type SaveSession,
  addSigil,
  addWrightstone,
  editSigil,
  editWrightstone,
  wrightstoneRoll,
  wrightstoneSubs,
  WRIGHTSTONE_MAINS,
  type SigilRoll,
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
import { SigilForm } from "./SigilForm";
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

/** The form's starting values for a sigil row. */
function sigilRollOf(row: Row): SigilRoll {
  const [, , level, primary, secondary] = row.cells as [
    unknown,
    unknown,
    number,
    KeyCell | undefined,
    KeyCell | undefined,
  ];
  return {
    level,
    primary: primary?.key ?? "",
    secondary: secondary?.key ?? "",
  };
}

type Editable = "wrightstones" | "sigils";

/** The row of `table` whose slot is `id`. */
const rowOf = (view: SaveView, table: Editable, id: number) => {
  const row = view.shared
    .find((t) => t.id === table)
    ?.rows.find((r) => r.cells[0] === id);
  return row && ({ tableId: table, rowId: row.id } satisfies RowRef);
};

/** Runs an add returning the new id, then selects its row. */
function add(table: Editable, run: (session: SaveSession) => number) {
  let id = 0;
  edit(
    (session) => {
      id = run(session);
    },
    (view) => rowOf(view, table, id),
  );
}

const editRow = (
  table: Editable,
  id: number,
  run: (session: SaveSession) => void,
) => edit(run, (view) => rowOf(view, table, id));

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
  const id = row?.cells[0] as number;
  const editor =
    adding === "wrightstones" ? (
      <WrightstoneForm
        key="add"
        applyLabel={t("edit.addWrightstone")}
        onApply={(roll) => {
          setAdding(undefined);
          add("wrightstones", (session) => addWrightstone(session, roll));
        }}
      />
    ) : adding === "sigils" ? (
      <SigilForm
        key="add"
        applyLabel={t("edit.addSigil")}
        onApply={(roll) => {
          setAdding(undefined);
          add("sigils", (session) => addSigil(session, roll));
        }}
      />
    ) : row && selection?.table.id === "wrightstones" ? (
      <WrightstoneForm
        key={row.id}
        initial={rollOf(row)}
        applyLabel={gt("ui", "apply")}
        onApply={(roll) =>
          editRow("wrightstones", id, (session) =>
            editWrightstone(session, id, roll),
          )
        }
      />
    ) : row && selection?.table.id === "sigils" ? (
      <SigilForm
        key={row.id}
        initial={sigilRollOf(row)}
        applyLabel={gt("ui", "apply")}
        onApply={(roll) =>
          editRow("sigils", id, (session) => editSigil(session, id, roll))
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
                    adding === "sigils"
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
          (table.id === "wrightstones" ? (
            <EditMenu
              actions={[
                {
                  label: t("edit.addWrightstone"),
                  run: () => setAdding("wrightstones"),
                },
              ]}
            />
          ) : table.id === "sigils" ? (
            <EditMenu
              actions={[
                { label: t("edit.addSigil"), run: () => setAdding("sigils") },
              ]}
            />
          ) : undefined)
        }
      />
    </>
  );
}
