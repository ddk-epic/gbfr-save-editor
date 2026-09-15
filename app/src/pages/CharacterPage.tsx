import { useTranslation } from "react-i18next";
import {
  CollapsibleSection,
  CollapsibleTables,
  ExpandCollapseActions,
} from "../components/CollapsibleTables";
import { EquipmentSets } from "../components/EquipmentSets";
import { useGameText } from "../game-text";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import type { Selection } from "../navigation";
import type { CharacterView } from "../save/view";

export function CharacterPage({
  fileName,
  character,
  open,
  setOpen,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  character: CharacterView;
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const name = gt("character", character.key) ?? character.key;
  const sections: string[] = [
    ...character.tables.map((table) => table.section),
    "equipment",
  ];
  const toggle = (section: string) => {
    const next = new Set(open);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setOpen(next);
  };

  return (
    <>
      <PageTop
        crumbs={[fileName, t("contents.characters"), name]}
        title={t("character.title", {
          name,
          level: character.level,
        })}
        onRoot={onRoot}
        actions={
          <ExpandCollapseActions
            onExpandAll={() => setOpen(new Set([...open, ...sections]))}
            onCollapseAll={() =>
              setOpen(new Set([...open].filter((s) => !sections.includes(s))))
            }
          />
        }
      >
        <RowPanel selected={selection} />
      </PageTop>
      <CollapsibleTables
        tables={character.tables}
        isOpen={(section) => open.has(section)}
        onToggle={toggle}
        selection={selection}
        onSelect={onSelect}
      >
        <CollapsibleSection
          section="equipment"
          count={character.equipment.length}
          open={open.has("equipment")}
          onToggle={() => toggle("equipment")}
        >
          <EquipmentSets
            sets={character.equipment}
            selection={selection}
            onSelect={onSelect}
          />
        </CollapsibleSection>
      </CollapsibleTables>
    </>
  );
}
