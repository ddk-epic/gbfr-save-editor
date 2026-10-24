import { isPlayable } from "gbfr-save-editor";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../i18n/game-text";
import { go, goToSection, usePage, type Page } from "../state/navigation";
import { useSave, useView } from "../state/save";
import type { SectionId } from "../view";

type Tab = "save" | "characters";

const tabOf = (page: Page): Tab | undefined =>
  page === "save"
    ? "save"
    : page === "characters" || page.startsWith("char:")
      ? "characters"
      : undefined;

export function ContentsTree() {
  const view = useView();
  const page = usePage();
  const session = useSave((save) => save?.session);
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
  // Forgotten on a new save.
  const [prevSession, setPrevSession] = useState(session);
  if (session !== prevSession) {
    setPrevSession(session);
    setLastCharacter(undefined);
  }

  const isDisabled = (key: string) => !isPlayable(key, view?.captain);
  const openCharacters = () => go(lastCharacter ?? "characters");

  return (
    <nav className="sticky top-0 h-fit space-y-4 py-6 text-sidebar-foreground">
      {view ? (
        <div>
          <div className="mb-2 flex border-b border-sidebar-border">
            <TabButton
              label={t("contents.save")}
              active={tab === "save"}
              onClick={() => go("save")}
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
                  to="save"
                  section={section}
                />
              ),
            )}
          {tab === "characters" && (
            <Link
              label={t("sections.party")}
              active={page === "characters"}
              to="characters"
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
                to={`char:${c.key}`}
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

/** A page link, or with `section` a link to that section of the page. */
const Link = memo(function Link({
  label,
  title,
  active,
  disabled,
  to,
  section,
}: {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  to: Page;
  section?: SectionId;
}) {
  return (
    <button
      onClick={() => (section ? goToSection(to, section) : go(to))}
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
});
