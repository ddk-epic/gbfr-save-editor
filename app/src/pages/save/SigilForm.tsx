import {
  SIGIL_LEVELS,
  sigilGem,
  sigilPrimaries,
  sigilSecondaries,
  type SigilRoll,
} from "gbfr-save-editor/edit";
import { Check } from "lucide-react";
import { useState } from "react";
import { useGameText } from "../../i18n/game-text";

const NUMERALS = ["", "I", "II", "III", "IV", "V"];

/** Level, primary and second trait of a sigil. */
export function SigilForm({
  initial,
  applyLabel,
  onApply,
}: {
  initial?: Partial<SigilRoll>;
  /** Tooltip of the check button. */
  applyLabel: string | undefined;
  onApply: (roll: SigilRoll) => void;
}) {
  const gt = useGameText();
  const [level, setLevel] = useState(initial?.level ?? 15);
  const [primary, setPrimary] = useState(initial?.primary ?? "");
  const [secondary, setSecondary] = useState(initial?.secondary ?? "");
  const levelValid = SIGIL_LEVELS.some((entry) => entry.level === level);
  const primaries = sigilPrimaries(level);
  const secondaries = primary ? sigilSecondaries(primary, level) : [];
  const valid =
    primary !== "" && sigilGem({ level, primary, secondary }) !== undefined;

  /** Drops a primary or second trait the new choice does not take. */
  const choose = (nextLevel: number, nextPrimary: string) => {
    const keep = sigilPrimaries(nextLevel).includes(nextPrimary);
    setLevel(nextLevel);
    setPrimary(keep ? nextPrimary : "");
    if (!keep || !sigilSecondaries(nextPrimary, nextLevel).includes(secondary))
      setSecondary("");
  };
  const traitName = (skill: string) => gt("trait", skill) ?? skill;

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

  // One row.
  return (
    <div className="flex items-end gap-x-6">
      {field(
        gt("ui", "level"),
        <select
          className={select}
          value={level}
          aria-invalid={!levelValid}
          onChange={(e) => choose(Number(e.target.value), primary)}
        >
          {!levelValid && (
            <option value={level} disabled>
              {gt("ui", "level")} {level}
            </option>
          )}
          {SIGIL_LEVELS.map((entry) => (
            <option key={entry.level} value={entry.level}>
              {gt("ui", "level")} {entry.level} {NUMERALS[entry.rarity]}
            </option>
          ))}
        </select>,
      )}
      <div className="grid grid-cols-2 gap-x-6">
        {field(
          `${gt("ui", "trait")} 1`,
          <select
            className={select}
            value={primary}
            aria-invalid={!primaries.includes(primary)}
            onChange={(e) => choose(level, e.target.value)}
          >
            <option value="" disabled>
              {gt("ui", "trait")} 1
            </option>
            {primary !== "" && !primaries.includes(primary) && (
              <option value={primary} disabled>
                {traitName(primary)}
              </option>
            )}
            {primaries.map((skill) => (
              <option key={skill} value={skill}>
                {traitName(skill)}
              </option>
            ))}
          </select>,
        )}
        {field(
          `${gt("ui", "trait")} 2`,
          <select
            className={select}
            value={secondary}
            disabled={primary === ""}
            aria-invalid={primary !== "" && !secondaries.includes(secondary)}
            onChange={(e) => setSecondary(e.target.value)}
          >
            <option value="" disabled={!secondaries.includes("")}>
              -
            </option>
            {secondary !== "" && !secondaries.includes(secondary) && (
              <option value={secondary} disabled>
                {traitName(secondary)}
              </option>
            )}
            {secondaries
              .filter((skill) => skill !== "")
              .map((skill) => (
                <option key={skill} value={skill}>
                  {traitName(skill)}
                </option>
              ))}
          </select>,
        )}
      </div>
      <button
        disabled={!valid}
        onClick={() => onApply({ level, primary, secondary })}
        title={applyLabel}
        aria-label={applyLabel}
        className="shrink-0 rounded-sm bg-primary p-1 text-primary-foreground enabled:hover:opacity-90 disabled:opacity-40"
      >
        <Check size={16} />
      </button>
    </div>
  );
}
