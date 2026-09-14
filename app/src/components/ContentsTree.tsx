import type { Page } from "../navigation";
import type { SaveView } from "../save/view";

export function ContentsTree({
  view,
  page,
  onPage,
  onTable,
}: {
  view: SaveView | undefined;
  page: Page;
  onPage: (page: Page) => void;
  /** Open a table's section on the account or a character page. */
  onTable: (page: Page, tableId: string) => void;
}) {
  const character = page.startsWith("char:") ? page.slice(5) : undefined;
  return (
    <nav className="sticky top-0 h-fit space-y-4 py-6 text-sidebar-foreground">
      <Link label="Welcome" active={page === "welcome"} onClick={() => onPage("welcome")} />
      {view ? (
        <>
          <div>
            <Heading label="Account" active={page === "account"} onClick={() => onPage("account")} />
            {view.account.map((t) => (
              <Link key={t.id} indent={1} label={t.label} onClick={() => onTable("account", t.id)} />
            ))}
          </div>
          <div>
            <div className="mb-1 text-[11px] tracking-widest text-subtle-foreground uppercase">Characters</div>
            {view.characters.map((c) => (
              <div key={c.key}>
                <Link indent={1} label={c.key} active={character === c.key} onClick={() => onPage(`char:${c.key}`)} />
                {character === c.key &&
                  c.tables.map((t) => (
                    <Link key={t.id} indent={2} label={t.label.split(",")[0]!} onClick={() => onTable(`char:${c.key}`, t.id)} />
                  ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-faint-foreground">Load a save to browse it.</p>
      )}
    </nav>
  );
}

function Heading({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 block text-[11px] tracking-widest uppercase ${active ? "text-sidebar-primary" : "text-subtle-foreground hover:text-sidebar-foreground"}`}
    >
      {label}
    </button>
  );
}

function Link({ label, active, onClick, indent = 0 }: { label: string; active?: boolean; onClick: () => void; indent?: 0 | 1 | 2 }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center py-0.5 text-left ${["", "pl-3", "pl-6"][indent]} ${
        active ? "text-sidebar-primary" : indent === 2 ? "text-subtle-foreground hover:text-sidebar-accent-foreground" : "text-muted-foreground hover:text-sidebar-accent-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
