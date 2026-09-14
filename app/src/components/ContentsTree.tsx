import { useTranslation } from "react-i18next";
import type { Page } from "../navigation";
import type { SaveView } from "../save/view";
import type en from "../i18n/en.json";

type CharacterSection = keyof typeof en.sectionsShort;

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
  const { t } = useTranslation();
  const character = page.startsWith("char:") ? page.slice(5) : undefined;
  return (
    <nav className="sticky top-0 h-fit space-y-4 py-6 text-sidebar-foreground">
      <Link
        label={t("contents.welcome")}
        active={page === "welcome"}
        onClick={() => onPage("welcome")}
      />
      {view ? (
        <>
          <div>
            <Heading
              label={t("contents.account")}
              active={page === "account"}
              onClick={() => onPage("account")}
            />
            {view.account.map((table) => (
              <Link
                key={table.id}
                indent={1}
                label={t(`sections.${table.section}`)}
                onClick={() => onTable("account", table.id)}
              />
            ))}
          </div>
          <div>
            <div className="mb-1 text-[11px] tracking-widest text-subtle-foreground uppercase">
              {t("contents.characters")}
            </div>
            {view.characters.map((c) => (
              <div key={c.key}>
                <Link
                  indent={1}
                  label={c.key}
                  active={character === c.key}
                  onClick={() => onPage(`char:${c.key}`)}
                />
                {character === c.key &&
                  c.tables.map((table) => (
                    <Link
                      key={table.id}
                      indent={2}
                      label={t(
                        `sectionsShort.${table.section as CharacterSection}`,
                      )}
                      onClick={() => onTable(`char:${c.key}`, table.id)}
                    />
                  ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-faint-foreground">{t("contents.empty")}</p>
      )}
    </nav>
  );
}

function Heading({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 block text-[11px] tracking-widest uppercase ${active ? "text-sidebar-primary" : "text-subtle-foreground hover:text-sidebar-foreground"}`}
    >
      {label}
    </button>
  );
}

function Link({
  label,
  active,
  onClick,
  indent = 0,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  indent?: 0 | 1 | 2;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center py-0.5 text-left ${["", "pl-3", "pl-6"][indent]} ${
        active
          ? "text-sidebar-primary"
          : indent === 2
            ? "text-subtle-foreground hover:text-sidebar-accent-foreground"
            : "text-muted-foreground hover:text-sidebar-accent-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
