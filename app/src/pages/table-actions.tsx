import { CHAPTER_ZERO_END_KEY, storyDifficulty } from "gbfr-save-editor";
import {
  advanceStory,
  clearHints,
  completeFateEpisodes,
  fillSkippedStory,
  maxAllWeaponSeries,
  maxCharacterLevel,
  maxMasterLevel,
  maxMasteryPoints,
  maxRupies,
  maxTreasures,
  maxWeaponSeries,
  removeOverMasteries,
  removeWrightstone,
  unlockAllCharacters,
  unlockAllWeaponSeries,
  unlockCharacter,
  unlockWeaponSeries,
} from "gbfr-save-editor/edit";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { gt as gameText, useGameText } from "../i18n/game-text";
import { edit } from "../state/actions";
import { EditMenu, type EditAction } from "../ui/EditMenu";
import type { Table, TableAction, TableLabelId } from "../view";
import { SIGILS_TABLE, WRIGHTSTONES_TABLE } from "../view/shared";

/** The tables whose add form a menu opens. */
export type AddTable = typeof SIGILS_TABLE | typeof WRIGHTSTONES_TABLE;

interface Context {
  t: TFunction;
  gt: typeof gameText;
  openAddForm: (table: AddTable) => void;
}

type Wiring = {
  [K in TableAction["type"]]: (
    action: Extract<TableAction, { type: K }>,
    context: Context,
  ) => EditAction;
};

const WIRING: Wiring = {
  maxRupies: (_, { t }) => ({
    label: t("edit.maxRupies"),
    run: () => edit(maxRupies),
  }),
  maxMasteryPoints: (_, { t }) => ({
    label: t("edit.maxMasteryPoints"),
    run: () => edit(maxMasteryPoints),
  }),
  unlockAllCharacters: (_, { t }) => ({
    label: t("edit.unlockAllCharacters"),
    run: () => edit(unlockAllCharacters),
  }),
  advanceStory: ({ target: { id, key, chapter } }, { t, gt }) => ({
    label: chapter
      ? t("edit.advanceStory", {
          chapter:
            key === CHAPTER_ZERO_END_KEY
              ? t("tables.chapterZeroEnd")
              : gt("chapterStartChapter", String(key)),
        })
      : t(`tables.${id as TableLabelId}`),
    run: () =>
      edit((draft, save) => {
        advanceStory(draft, id, storyDifficulty(save));
        fillSkippedStory(draft);
      }),
  }),
  clearHints: (_, { t }) => ({
    label: t("tables.clearHints"),
    run: () => edit(clearHints),
  }),
  maxTreasures: (_, { t }) => ({
    label: t("edit.maxTreasures"),
    run: () => edit(maxTreasures),
  }),
  unlockAllWeapons: (_, { t }) => ({
    label: t("edit.unlockAllWeapons"),
    run: () => edit(unlockAllWeaponSeries),
  }),
  maxAllWeapons: (_, { t }) => ({
    label: t("edit.maxAllWeapons"),
    run: () => edit(maxAllWeaponSeries),
  }),
  addSigil: (_, { t, openAddForm }) => ({
    label: t("edit.addSigil"),
    run: () => openAddForm(SIGILS_TABLE),
  }),
  addWrightstone: (_, { t, openAddForm }) => ({
    label: t("edit.addWrightstone"),
    run: () => openAddForm(WRIGHTSTONES_TABLE),
  }),
  removeOverMasteries: ({ entity }, { t }) => ({
    label: t("edit.removeOverMasteries"),
    run: () => edit((draft) => removeOverMasteries(draft, entity)),
  }),
  unlockCharacter: ({ entity }, { gt }) => ({
    label: gt("ui", "unlockCharacter")!,
    run: () => edit((draft) => unlockCharacter(draft, entity)),
  }),
  maxCharacterLevel: ({ entity }, { t }) => ({
    label: t("edit.maxCharacterLevel"),
    run: () => edit((draft) => maxCharacterLevel(draft, entity)),
  }),
  maxMasterLevel: ({ entity }, { t }) => ({
    label: t("edit.maxMasterLevel"),
    run: () => edit((draft) => maxMasterLevel(draft, entity)),
  }),
  completeFateEpisodes: ({ character }, { t }) => ({
    label: t("edit.completeFateEpisodes"),
    run: () => edit((draft) => completeFateEpisodes(draft, character)),
  }),
  unlockWeaponSeries: ({ entity }, { t }) => ({
    label: t("edit.unlockWeaponSeries"),
    run: () => edit((draft) => unlockWeaponSeries(draft, entity)),
  }),
  maxWeaponSeries: ({ entity }, { t }) => ({
    label: t("edit.maxWeaponSeries"),
    run: () => edit((draft) => maxWeaponSeries(draft, entity)),
  }),
  removeWrightstone: ({ weaponId }, { t }) => ({
    label: t("edit.removeWrightstone"),
    run: () => edit((draft) => removeWrightstone(draft, weaponId)),
  }),
};

/** The edit menu of a table's actions, then `extra`; nothing for a table without a menu. */
export function TableMenu({
  table,
  openAddForm,
  extra = [],
}: {
  table: Table;
  openAddForm?: (table: AddTable) => void;
  extra?: EditAction[];
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  if (!table.actions) return null;
  const context: Context = {
    t,
    gt,
    openAddForm: openAddForm ?? (() => undefined),
  };
  const wire = WIRING as Record<
    TableAction["type"],
    (action: TableAction, context: Context) => EditAction
  >;
  return (
    <EditMenu
      actions={[
        ...table.actions.map((action) => wire[action.type]!(action, context)),
        ...extra,
      ]}
    />
  );
}
