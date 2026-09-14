import { FolderOpen, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, TitleBar } from "./components/Bars";
import { ContentsTree } from "./components/ContentsTree";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToolbarButton } from "./components/ToolbarButton";
import { ValidationMenu } from "./components/ValidationMenu";
import { scrollToSection, type Page, type Selection } from "./navigation";
import { AccountPage } from "./pages/AccountPage";
import { CharacterPage } from "./pages/CharacterPage";
import { WelcomePage } from "./pages/WelcomePage";
import { loadSave, type LoadedSave, type LoadError } from "./save/load";
import { useScrollGutter } from "./useScrollGutter";

export function App() {
  const { t } = useTranslation();
  const [save, setSave] = useState<LoadedSave>();
  const [loadError, setLoadError] = useState<LoadError>();
  const [page, setPage] = useState<Page>("welcome");
  const [open, setOpen] = useState<Set<string>>(() => new Set(["sigils"]));
  const [selection, setSelection] = useState<Selection>();
  const [validationOpen, setValidationOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [scrollRef, gutter] = useScrollGutter<HTMLDivElement>();

  const view = save?.view;

  const openFile = async (file: File) => {
    const result = await loadSave(file);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setSave(result.save);
    setLoadError(undefined);
    setSelection(undefined);
  };
  const closeFile = () => {
    setSave(undefined);
    setSelection(undefined);
    setValidationOpen(false);
    setPage("welcome");
  };
  const go = (next: Page) => {
    // The row panel belongs to a page; leaving the page clears it.
    if (next !== page) setSelection(undefined);
    setPage(next);
  };
  const goToTable = (next: Page, tableId: string) => {
    if (next === "account") setOpen((o) => new Set(o).add(tableId));
    go(next);
    scrollToSection(tableId);
  };

  const character = page.startsWith("char:")
    ? view?.characters.find((c) => `char:${c.key}` === page)
    : undefined;

  return (
    <div className="flex h-screen flex-col bg-background font-mono text-[13px] text-foreground">
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

      <TitleBar gutter={gutter} fileName={save?.fileName}>
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
        {save && (
          <ToolbarButton onClick={closeFile}>
            <X size={13} /> {t("toolbar.close")}
          </ToolbarButton>
        )}
        <ThemeToggle />
      </TitleBar>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-gutter-both"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[190px_1fr] gap-8 px-6">
          <ContentsTree
            view={view}
            page={page}
            onPage={go}
            onTable={goToTable}
          />
          <main className="min-w-0 pb-16">
            {page === "welcome" && (
              <WelcomePage
                loadError={loadError}
                onPick={() => fileInput.current?.click()}
                onFile={(file) => void openFile(file)}
              />
            )}
            {save && page === "account" && (
              <AccountPage
                fileName={save.fileName}
                tables={save.view.account}
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
