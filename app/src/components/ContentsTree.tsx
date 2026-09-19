import { isNPC, isUnchosenCaptain, isUnused } from "gbfr-save-editor";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../game-text";
import type { Page } from "../navigation";
import type { SaveView, SectionId } from "../save/view";

type Tab = "save" | "characters";

const tabOf = (page: Page): Tab | undefined =>
  page === "save"
    ? "save"
    : page === "characters" || page.startsWith("char:")
      ? "characters"
      : undefined;

export function ContentsTree({
  view,
  page,
  onPage,
  onSection,
}: {
  view: SaveView | undefined;
  page: Page;
  onPage: (page: Page) => void;
  /** Open a section on the save or a character page. */
  onSection: (page: Page, section: SectionId) => void;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const character = page.startsWith("char:") ? page.slice(5) : undefined;

  const [tab, setTab] = useState<Tab>(tabOf(page) ?? "save");
  // The character page last shown, reopened by the characters tab; the party landing page until then.
  const [lastCharacter, setLastCharacter] = useState<Page>();
  const [prevPage, setPrevPage] = useState(page);
  if (page !== prevPage) {
    setPrevPage(page);
    const next = tabOf(page);
    if (next) setTab(next);
    if (page.startsWith("char:")) setLastCharacter(page);
  }
  const [prevView, setPrevView] = useState(view);
  if (view !== prevView) {
    setPrevView(view);
    setLastCharacter(undefined);
  }

  const isDisabled = (key: string) =>
    isNPC(key) || isUnused(key) || isUnchosenCaptain(key, view?.captain);
  const openCharacters = () => onPage(lastCharacter ?? "characters");

  return (
    <nav className="sticky top-0 h-fit space-y-4 py-6 text-sidebar-foreground">
      {view ? (
        <div>
          <div className="mb-2 flex border-b border-sidebar-border">
            <TabButton
              label={t("contents.save")}
              active={tab === "save"}
              onClick={() => onPage("save")}
            />
            <TabButton
              label={t("contents.characters")}
              active={tab === "characters"}
              onClick={openCharacters}
            />
          </div>
          {tab === "save" &&
            [...new Set(view.shared.map((table) => table.section))].map(
              (section) => (
                <Link
                  key={section}
                  label={t(`sections.${section}`)}
                  onClick={() => onSection("save", section)}
                />
              ),
            )}
          {tab === "characters" && (
            <Link
              label={t("sections.party")}
              active={page === "characters"}
              onClick={() => onPage("characters")}
            />
          )}
          {tab === "characters" &&
            view.characters.map((c) => (
              <Link
                key={c.key}
                label={gt("character", c.key) ?? c.key}
                title={c.key}
                disabled={isDisabled(c.key)}
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
      className={`-mb-px flex-1 border-b-2 pb-1 text-center text-[12px] tracking-wider uppercase ${active ? "border-sidebar-primary text-sidebar-primary" : "border-transparent text-subtle-foreground hover:border-white/40 hover:text-sidebar-foreground"}`}
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
      className={`flex w-full items-center pt-px pb-0.5 text-left ${
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
