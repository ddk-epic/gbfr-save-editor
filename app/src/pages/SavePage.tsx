import {
  CollapsibleTables,
  ExpandCollapseActions,
} from "../components/CollapsibleTables";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import type { Selection } from "../navigation";
import type { Table } from "../save/view";

/** A page of shared tables: the save, or the characters landing page. */
export function SavePage({
  fileName,
  title,
  tables,
  open,
  setOpen,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  title: string;
  tables: Table[];
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
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
