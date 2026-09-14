import { useTranslation } from "react-i18next";
import {
  CollapsibleTables,
  ExpandCollapseActions,
} from "../components/CollapsibleTables";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import type { Selection } from "../navigation";
import type { Table } from "../save/view";

export function AccountPage({
  fileName,
  tables,
  open,
  setOpen,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  tables: Table[];
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
  const { t } = useTranslation();
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  return (
    <>
      <PageTop
        crumbs={[fileName, t("contents.account")]}
        title={t("contents.account")}
        onRoot={onRoot}
        actions={
          <ExpandCollapseActions
            onExpandAll={() =>
              setOpen(new Set([...open, ...tables.map((t) => t.id)]))
            }
            onCollapseAll={() =>
              setOpen(
                new Set(
                  [...open].filter((id) => !tables.some((t) => t.id === id)),
                ),
              )
            }
          />
        }
      >
        <RowPanel selected={selection} />
      </PageTop>
      <CollapsibleTables
        tables={tables}
        isOpen={(table) => open.has(table.id)}
        onToggle={(table) => toggle(table.id)}
        selection={selection}
        onSelect={onSelect}
      />
    </>
  );
}
