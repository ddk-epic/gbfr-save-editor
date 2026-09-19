import { FolderOpen } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, TitleBar } from "./components/Bars";
import { ContentsTree } from "./components/ContentsTree";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToolbarButton } from "./components/ToolbarButton";
import { ValidationMenu } from "./components/ValidationMenu";
import { scrollToSection, type Page, type Selection } from "./navigation";
import { SavePage } from "./pages/SavePage";
import { CharacterPage } from "./pages/CharacterPage";
import { WelcomePage } from "./pages/WelcomePage";
import { loadSave, type LoadedSave, type LoadError } from "./save/load";
import type { SectionId } from "./save/view";
import { useScrollGutter } from "./useScrollGutter";

const DEFAULT_OPEN = ["profile", "party", "stats", "gear"];

export function App() {
  const { t } = useTranslation();
  const [save, setSave] = useState<LoadedSave>();
  const [loadError, setLoadError] = useState<LoadError>();
  const [page, setPage] = useState<Page>("welcome");
  // Open sections by section id, shared by the save and every character.
  const [open, setOpen] = useState<Set<string>>(() => new Set(DEFAULT_OPEN));
  const [selection, setSelection] = useState<Selection>();
  const [validationOpen, setValidationOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [scrollRef, gutter] = useScrollGutter<HTMLDivElement>();
  // Scroll position by page, so each page keeps its own; cleared per save.
  const scrollTops = useRef(new Map<Page, number>());

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = scrollTops.current.get(page) ?? 0;
  }, [page, save, scrollRef]);

  const view = save?.view;

  const openFile = async (file: File) => {
    const result = await loadSave(file);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    scrollTops.current.clear();
    setOpen(new Set(DEFAULT_OPEN));
    setSave(result.save);
    setLoadError(undefined);
    setSelection(undefined);
    setPage("save");
  };
  const go = (next: Page) => {
    // The row panel belongs to a page; leaving the page clears it.
    if (next !== page) setSelection(undefined);
    scrollTops.current.set(page, scrollRef.current?.scrollTop ?? 0);
    setPage(next);
  };
  const goToSection = (next: Page, section: SectionId) => {
    setOpen((o) => new Set(o).add(section));
    go(next);
    scrollToSection(section);
  };

  const character = page.startsWith("char:")
    ? view?.characters.find((c) => `char:${c.key}` === page)
    : undefined;

  return (
    <div className="flex h-screen flex-col bg-background font-mono text-[14px] text-foreground">
      <input
        ref={fileInput}
        type="file"
        accept=".dat"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void openFile(file);
          e.target.value = "";
        }}
      />

      <TitleBar
        gutter={gutter}
        fileName={save?.fileName}
        onHome={() => go("welcome")}
      >
        {view && (
          <ValidationMenu
            view={view}
            open={validationOpen}
            setOpen={setValidationOpen}
          />
        )}
        <ToolbarButton onClick={() => fileInput.current?.click()}>
          <FolderOpen size={13} /> {t("toolbar.open")}
        </ToolbarButton>
        <ThemeToggle />
      </TitleBar>

      <div
        ref={scrollRef}
        data-page-scroll
        className="min-h-0 flex-1 overflow-y-auto scrollbar-gutter-both"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[172px_1fr] gap-8 px-6">
          <ContentsTree
            view={view}
            page={page}
            onPage={go}
            onSection={goToSection}
          />
          <main className="min-w-0 pb-[60vh]">
            {page === "welcome" && (
              <WelcomePage
                loadError={loadError}
                onPick={() => fileInput.current?.click()}
                onFile={(file) => void openFile(file)}
              />
            )}
            {save && page === "save" && (
              <SavePage
                fileName={save.fileName}
                title={t("contents.save")}
                tables={save.view.shared}
                open={open}
                setOpen={setOpen}
                selection={selection}
                onSelect={setSelection}
                onRoot={() => go("welcome")}
              />
            )}
            {save && page === "characters" && (
              <SavePage
                fileName={save.fileName}
                title={t("contents.characters")}
                tables={save.view.party}
                open={open}
                setOpen={setOpen}
                selection={selection}
                onSelect={setSelection}
                onRoot={() => go("welcome")}
              />
            )}
            {save && character && (
              <CharacterPage
                fileName={save.fileName}
                character={character}
                open={open}
                setOpen={setOpen}
                selection={selection}
                onSelect={setSelection}
                onRoot={() => go("welcome")}
              />
            )}
          </main>
        </div>
      </div>

      <StatusBar gutter={gutter} view={view} />
    </div>
  );
}
