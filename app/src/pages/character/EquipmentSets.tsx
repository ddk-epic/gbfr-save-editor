import { equipWeapon, removeWrightstone } from "gbfr-save-editor/edit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";
import { edit } from "../../state/actions";
import { LabeledTable } from "../../tables/SelectableTable";
import { TableLabel } from "../../ui/DataTable";
import { EditMenu } from "../../ui/EditMenu";
import type { EquipmentSetView } from "../../view";

/** The equipped set and each loadout as tabs: skills and sigils left, weapon and wrightstone right. */
export function EquipmentSets({ sets }: { sets: EquipmentSetView[] }) {
  const { t } = useTranslation();
  const gt = useGameText();
  const [setId, setSetId] = useState(sets[0]?.id);
  const set = sets.find((s) => s.id === setId) ?? sets[0];
  if (!set) return null;
  return (
    <div className="pb-3">
      <div className="flex items-end pb-1">
        <div className="flex w-full border-b border-border">
          {sets.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSetId(s.id)}
              className={`-mb-px border-b-2 px-[min(0.75rem,1%)] pb-1 whitespace-nowrap ${s === set ? "border-primary text-primary" : "border-transparent text-subtle-foreground hover:border-white/40 hover:text-strong-foreground"}`}
            >
              {s.partySet !== undefined
                ? t("equipment.partySet", { number: s.partySet })
                : i === 0
                  ? t("equipment.equipped")
                  : t("equipment.loadout", {
                      number: String(i).padStart(2, "0"),
                    })}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              {set.name !== undefined && (
                <>
                  <div className="flex items-end pb-1">
                    <TableLabel>{t("equipment.name")}</TableLabel>
                  </div>
                  <h3 className="text-strong-foreground">{set.name}</h3>
                </>
              )}
            </div>
            <div className="min-w-0">
              <LabeledTable
                label={t("equipment.skills")}
                table={set.skills}
                flush
              />
            </div>
          </div>
          <LabeledTable label={t("equipment.sigils")} table={set.sigils} />
        </div>
        <div className="min-w-0">
          <LabeledTable
            label={t("equipment.weapon")}
            table={set.weapon}
            flush
            menu={
              <EditMenu
                actions={set.weaponOptions.map((weapon) => ({
                  label: t("edit.equipWeapon", {
                    weapon:
                      (weapon.series !== undefined &&
                        gt("weaponSeries", String(weapon.series))) ||
                      gt("weapon", weapon.key) ||
                      weapon.key,
                  }),
                  run: () =>
                    edit((session) =>
                      equipWeapon(session, set.characterEntity!, weapon.id),
                    ),
                }))}
              />
            }
          />
          <LabeledTable
            label={t("equipment.wrightstone")}
            table={set.wrightstone}
            menu={
              <EditMenu
                actions={
                  set.wrightstoneWeaponId === undefined
                    ? []
                    : [
                        {
                          label: t("edit.removeWrightstone"),
                          run: () =>
                            edit((session) =>
                              removeWrightstone(
                                session,
                                set.wrightstoneWeaponId!,
                              ),
                            ),
                        },
                      ]
                }
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
