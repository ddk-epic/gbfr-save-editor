import { DataTable } from "../components/DataTable";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import { sectionId, type Selection } from "../navigation";
import type { CharacterView } from "../save/view";

export function CharacterPage({
  fileName,
  character,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  character: CharacterView;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
  return (
    <>
      <PageTop crumbs={[fileName, "Characters", character.key]} title={`${character.key} · Lv ${character.level}`} onRoot={onRoot}>
        <RowPanel selected={selection} />
      </PageTop>
      <div className="space-y-8 pt-2">
        {character.tables.map((table) => (
          <section key={table.id} id={sectionId(table.id)} className="scroll-mt-72">
            <h2 className="mb-1 border-b border-border pb-1 text-strong-foreground">{table.label}</h2>
            <DataTable
              table={table}
              selectedRowId={selection?.row.id}
              onSelect={(rowId) => onSelect({ table, row: table.rows.find((r) => r.id === rowId)! })}
            />
          </section>
        ))}
      </div>
    </>
  );
}
