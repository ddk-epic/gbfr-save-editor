import {
  addWrightstone,
  completeFateEpisodes,
  editWrightstone,
  equipWeapon,
  removeOverMasteries,
  removeWrightstone,
} from "gbfr-save-editor/edit";
import { FolderOpen } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, TitleBar } from "./components/Bars";
import { ContentsTree } from "./components/ContentsTree";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToolbarButton } from "./components/ToolbarButton";
import { ValidationMenu } from "./components/ValidationMenu";
import { ExportMenu } from "./components/ExportMenu";
import { scrollToSection, type Page, type Selection } from "./navigation";
import { SavePage } from "./pages/SavePage";
import { CharacterPage } from "./pages/CharacterPage";
import { WelcomePage } from "./pages/WelcomePage";
import {
  applyEdit,
  downloadSave,
  loadSave,
  type LoadedSave,
  type LoadError,
} from "./save/load";
import type { SectionId } from "./save/view";
import { useScrollGutter } from "./useScrollGutter";

const DEFAULT_OPEN = ["profile", "party", "equippedSummons", "stats", "gear"];

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
  // Scroll position by page, cleared per save.
  const scrollTops = useRef(new Map<Page, number>());

  // Restores the page's scroll position, also after an edit.
  const session = save?.session;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = scrollTops.current.get(page) ?? 0;
  }, [page, session, scrollRef]);

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
    // Leaving a page clears its selection.
    if (next !== page) setSelection(undefined);
    scrollTops.current.set(page, scrollRef.current?.scrollTop ?? 0);
    setPage(next);
  };
  const goToSection = (next: Page, section: SectionId) => {
    setOpen((o) => new Set(o).add(section));
    go(next);
    scrollToSection(section);
  };

  const edit = (
    run: Parameters<typeof applyEdit>[1],
    select?: (next: LoadedSave) => Selection | undefined,
  ) => {
    if (!save) return;
    const next = applyEdit(save, run);
    setSelection(select?.(next));
    setSave(next);
  };
  const stoneRow = (next: LoadedSave, id: number): Selection | undefined => {
    const table = next.view.shared.find((t) => t.id === "wrightstones");
    const row = table?.rows.find((r) => r.cells[0] === id);
    return table && row && { table, row };
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
            issues={save?.issues ?? []}
            open={validationOpen}
            setOpen={setValidationOpen}
          />
        )}
        <ExportMenu
          fileName={save?.edited ? save.fileName : undefined}
          onDownload={() => save && downloadSave(save)}
        />
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
                onAddWrightstone={(roll) => {
                  let id = 0;
                  edit(
                    (session) => {
                      id = addWrightstone(session, roll);
                    },
                    (next) => stoneRow(next, id),
                  );
                }}
                onEditWrightstone={(id, roll) =>
                  edit(
                    (session) => editWrightstone(session, id, roll),
                    (next) => stoneRow(next, id),
                  )
                }
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
                onRemoveWrightstone={(weaponId) =>
                  edit((session) => removeWrightstone(session, weaponId))
                }
                onEquipWeapon={(character, weaponId) =>
                  edit((session) => equipWeapon(session, character, weaponId))
                }
                onRemoveOverMasteries={(character) =>
                  edit((session) => removeOverMasteries(session, character))
                }
                onCompleteFateEpisodes={(character) =>
                  edit((session) => completeFateEpisodes(session, character))
                }
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
