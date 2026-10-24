import {
  WRIGHTSTONE_MAINS,
  WRIGHTSTONE_PRESETS,
  WRIGHTSTONE_SUB_GROUPS,
  wrightstoneKey,
  wrightstoneSubs,
  type WrightstoneFamily,
  type WrightstonePreset,
  type WrightstoneRoll,
} from "gbfr-save-editor/edit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../game-text";

const FAMILIES = Object.keys(WRIGHTSTONE_MAINS).map(
  Number,
) as WrightstoneFamily[];
const PRESETS = Object.keys(WRIGHTSTONE_PRESETS) as WrightstonePreset[];
const GROUPS = Object.keys(
  WRIGHTSTONE_SUB_GROUPS,
) as (keyof typeof WRIGHTSTONE_SUB_GROUPS)[];

/** Family, preset and sub traits of a top wrightstone. */
export function WrightstoneForm({
  initial,
  applyLabel,
  onApply,
  onCancel,
}: {
  initial?: Partial<WrightstoneRoll>;
  applyLabel: string;
  onApply: (roll: WrightstoneRoll) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const [family, setFamily] = useState(initial?.family ?? FAMILIES[0]!);
  const [preset, setPreset] = useState(initial?.preset ?? "top");
  const [subs, setSubs] = useState<[string, string]>([
    initial?.subs?.[0] ?? "",
    initial?.subs?.[1] ?? "",
  ]);
  const main = WRIGHTSTONE_MAINS[family];
  const levels = WRIGHTSTONE_PRESETS[preset].levels;
  const allowed = wrightstoneSubs(family);
  const valid = subs.every((sub) => allowed.includes(sub));

  const field = (label: string, control: React.ReactNode) => (
    <label className="flex flex-col gap-1 text-[14px]">
      <span className="text-[13px] tracking-wide text-subtle-foreground uppercase">
        {label}
      </span>
      {control}
    </label>
  );
  const select =
    "rounded-sm border border-input bg-background px-1.5 py-0.5 text-foreground aria-invalid:border-destructive";

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      {field(
        t("wrightstoneForm.family"),
        <select
          className={select}
          value={family}
          onChange={(e) =>
            setFamily(Number(e.target.value) as WrightstoneFamily)
          }
        >
          {FAMILIES.map((f) => (
            <option key={f} value={f}>
              {gt("trait", WRIGHTSTONE_MAINS[f])} ·{" "}
              {gt("item", wrightstoneKey({ family: f, preset, subs }))}
            </option>
          ))}
        </select>,
      )}
      {field(
        t("wrightstoneForm.preset"),
        <select
          className={select}
          value={preset}
          onChange={(e) => setPreset(e.target.value as WrightstonePreset)}
        >
          {PRESETS.map((p) => (
            <option key={p} value={p}>
              {WRIGHTSTONE_PRESETS[p].levels.join(" / ")}
            </option>
          ))}
        </select>,
      )}
      {subs.map((sub, i) =>
        field(
          `${t(i === 0 ? "columns.sub1" : "columns.sub2")} · Lv ${levels[i + 1]}`,
          <select
            key={i}
            className={select}
            value={sub}
            aria-invalid={!allowed.includes(sub)}
            onChange={(e) => {
              const next: [string, string] = [...subs];
              next[i] = e.target.value;
              setSubs(next);
            }}
          >
            <option value="" disabled>
              {t("wrightstoneForm.pick")}
            </option>
            {GROUPS.map((group) => (
              <optgroup
                key={group}
                label={t(`wrightstoneForm.groups.${group}`)}
              >
                {WRIGHTSTONE_SUB_GROUPS[group]
                  .filter((key) => key !== main || key === sub)
                  .map((key) => (
                    <option key={key} value={key} disabled={key === main}>
                      {gt("trait", key) ?? key}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>,
        ),
      )}
      <div className="flex gap-2">
        <button
          disabled={!valid}
          onClick={() => onApply({ family, preset, subs })}
          className="rounded-sm bg-primary px-2 py-0.5 text-primary-foreground enabled:hover:opacity-90 disabled:opacity-40"
        >
          {applyLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-sm px-2 py-0.5 text-subtle-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {t("wrightstoneForm.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
