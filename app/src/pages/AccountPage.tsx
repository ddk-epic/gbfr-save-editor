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
        crumbs={[fileName, t("contents.account")]}
        title={t("contents.account")}
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
        <RowPanel selected={selection} />
      </PageTop>
      <CollapsibleTables
        tables={tables}
        isOpen={(section) => open.has(section)}
        onToggle={toggle}
        selection={selection}
        onSelect={onSelect}
      />
    </>
  );
}
