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
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../../i18n/game-text";

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
}: {
  initial?: Partial<WrightstoneRoll>;
  /** Tooltip of the check button. */
  applyLabel: string | undefined;
  onApply: (roll: WrightstoneRoll) => void;
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

  const field = (label: React.ReactNode, control: React.ReactNode) => (
    <label className="flex min-w-0 flex-col gap-1 text-[14px]">
      <span className="text-[13px] tracking-wide text-subtle-foreground uppercase">
        {label}
      </span>
      {control}
    </label>
  );
  const select =
    "w-full rounded-sm border border-input bg-background px-1.5 py-0.5 text-foreground aria-invalid:border-destructive";

  // One row; the selects shrink to fit.
  return (
    <div className="flex items-end gap-x-6">
      {field(
        gt("ui", "trait"),
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
        gt("ui", "level"),
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
          `${t(i === 0 ? "columns.sub1" : "columns.sub2", { trait: gt("ui", "trait") })} · ${gt("ui", "traitLevel")} ${levels[i + 1]}`,
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
              {gt("ui", "trait")} {i + 1}
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
      <button
        disabled={!valid}
        onClick={() => onApply({ family, preset, subs })}
        title={applyLabel}
        aria-label={applyLabel}
        className="shrink-0 rounded-sm bg-primary p-1 text-primary-foreground enabled:hover:opacity-90 disabled:opacity-40"
      >
        <Check size={16} />
      </button>
    </div>
  );
}
