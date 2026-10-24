import { FolderOpen } from "lucide-react";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { CharacterPage } from "../pages/character/CharacterPage";
import { SavePage } from "../pages/save/SavePage";
import { WelcomePage } from "../pages/WelcomePage";
import { pickFile } from "../state/actions";
import { savedScrollTop, usePage } from "../state/navigation";
import { useSave } from "../state/save";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ToolbarButton } from "../ui/ToolbarButton";
import { useScrollGutter } from "../ui/useScrollGutter";
import { StatusBar, TitleBar } from "./Bars";
import { ContentsTree } from "./ContentsTree";
import { ExportMenu } from "./ExportMenu";
import { ValidationMenu } from "./ValidationMenu";

export function App() {
  const { t } = useTranslation();
  const page = usePage();
  const [scrollRef, gutter] = useScrollGutter<HTMLDivElement>();

  // Restores the page's scroll position.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = savedScrollTop(page);
  }, [page, scrollRef]);

  return (
    <div className="flex h-screen flex-col bg-background font-mono text-[14px] text-foreground">
      <TitleBar gutter={gutter}>
        <ValidationMenu />
        <ExportMenu />
        <ToolbarButton onClick={pickFile}>
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
          <ContentsTree />
          <main className="min-w-0 pb-[60vh]">
            <Page />
          </main>
        </div>
      </div>

      <StatusBar gutter={gutter} />
    </div>
  );
}

function Page() {
  const { t } = useTranslation();
  const page = usePage();
  const fileName = useSave((save) => save?.fileName);
  const shared = useSave((save) => save?.view.shared);
  const party = useSave((save) => save?.view.party);
  const character = useSave((save) =>
    save?.view.characters.find((c) => `char:${c.key}` === page),
  );

  if (page === "welcome" || fileName === undefined) return <WelcomePage />;
  if (page === "save" && shared)
    return (
      <SavePage
        key="save"
        fileName={fileName}
        title={t("contents.save")}
        tables={shared}
        editable
      />
    );
  if (page === "characters" && party)
    return (
      <SavePage
        key="characters"
        fileName={fileName}
        title={t("contents.characters")}
        tables={party}
      />
    );
  if (character)
    return <CharacterPage fileName={fileName} character={character} />;
  return null;
}
