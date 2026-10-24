import {
  wrightstoneRoll,
  wrightstoneSubs,
  WRIGHTSTONE_MAINS,
  type WrightstoneFamily,
  type WrightstoneRoll,
} from "gbfr-save-editor/edit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CollapsibleTables,
  ExpandCollapseActions,
} from "../components/CollapsibleTables";
import { EditMenu } from "../components/EditMenu";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import { WrightstoneForm } from "../components/WrightstoneForm";
import { useGameText } from "../game-text";
import type { Selection } from "../navigation";
import type { KeyCell, Row, Table } from "../save/view";

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

/** A page of shared tables: the save, or the characters landing page. */
export function SavePage({
  fileName,
  title,
  tables,
  open,
  setOpen,
  selection,
  onSelect,
  onAddWrightstone,
  onEditWrightstone,
  onRoot,
}: {
  fileName: string;
  title: string;
  tables: Table[];
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection | undefined) => void;
  onAddWrightstone?: (roll: WrightstoneRoll) => void;
  onEditWrightstone?: (id: number, roll: WrightstoneRoll) => void;
  onRoot: () => void;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const [adding, setAdding] = useState(false);
  const select = (next: Selection) => {
    setAdding(false);
    onSelect(next);
  };
  const stone =
    selection?.table.id === "wrightstones" ? selection.row : undefined;
  const editor = adding ? (
    <WrightstoneForm
      key="add"
      applyLabel={t("edit.addWrightstone")}
      onApply={(roll) => {
        setAdding(false);
        onAddWrightstone?.(roll);
      }}
    />
  ) : stone && onEditWrightstone ? (
    <WrightstoneForm
      key={stone.id}
      initial={rollOf(stone)}
      applyLabel={gt("ui", "apply")}
      onApply={(roll) => onEditWrightstone(stone.cells[0] as number, roll)}
    />
  ) : undefined;

  const sections: string[] = tables.map((table) => table.section);
  const toggle = (section: string) => {
    const next = new Set(open);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setOpen(next);
  };

  return (
    <>
      <PageTop
        crumbs={[fileName, title]}
        title={title}
        onRoot={onRoot}
        actions={
          <ExpandCollapseActions
            onExpandAll={() => setOpen(new Set([...open, ...sections]))}
            onCollapseAll={() =>
              setOpen(new Set([...open].filter((s) => !sections.includes(s))))
            }
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
          onClose={() => (adding ? setAdding(false) : onSelect(undefined))}
        />
      </PageTop>
      <CollapsibleTables
        tables={tables}
        isOpen={(section) => open.has(section)}
        onToggle={toggle}
        selection={selection}
        onSelect={select}
        menuOf={(table) =>
          table.id === "wrightstones" &&
          onAddWrightstone && (
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
