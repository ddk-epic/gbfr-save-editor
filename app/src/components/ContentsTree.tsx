import { isNPC, isUnused } from "gbfr-save-editor";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../game-text";
import type { Page } from "../navigation";
import type { SaveView } from "../save/view";

type Tab = "account" | "characters";

const tabOf = (page: Page): Tab | undefined =>
  page === "account"
    ? "account"
    : page.startsWith("char:")
      ? "characters"
      : undefined;

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
  const gt = useGameText();
  const character = page.startsWith("char:") ? page.slice(5) : undefined;

  const [tab, setTab] = useState<Tab>(tabOf(page) ?? "account");
  const [prevPage, setPrevPage] = useState(page);
  if (page !== prevPage) {
    setPrevPage(page);
    const next = tabOf(page);
    if (next) setTab(next);
  }

  return (
    <nav className="sticky top-0 h-fit space-y-4 py-6 text-sidebar-foreground">
      {view ? (
        <div>
          <div className="mb-2 flex border-b border-sidebar-border">
            <TabButton
              label={t("contents.account")}
              active={tab === "account"}
              onClick={() => setTab("account")}
            />
            <TabButton
              label={t("contents.characters")}
              active={tab === "characters"}
              onClick={() => setTab("characters")}
            />
          </div>
          {tab === "account" &&
            view.account.map((table) => (
              <Link
                key={table.id}
                label={t(`sections.${table.section}`)}
                onClick={() => onTable("account", table.id)}
              />
            ))}
          {tab === "characters" &&
            view.characters.map((c) => (
              <Link
                key={c.key}
                label={gt("character", c.key) ?? c.key}
                title={c.key}
                disabled={isNPC(c.key) || isUnused(c.key)}
                active={character === c.key}
                onClick={() => onPage(`char:${c.key}`)}
              />
            ))}
        </div>
      ) : (
        <p className="text-faint-foreground">{t("contents.empty")}</p>
      )}
    </nav>
  );
}

function TabButton({
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
      className={`-mb-px flex-1 border-b-2 pb-1 text-center text-[12px] tracking-wider uppercase ${active ? "border-sidebar-primary text-sidebar-primary" : "border-transparent text-subtle-foreground hover:text-sidebar-foreground"}`}
    >
      {label}
    </button>
  );
}

function Link({
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex w-full items-center pb-0.5 text-left ${
        active
          ? "text-sidebar-primary"
          : disabled
            ? "cursor-default text-faint-foreground"
            : "text-muted-foreground hover:text-sidebar-accent-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
