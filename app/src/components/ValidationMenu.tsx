import { AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SaveView } from "../save/view";

/** Title bar summary of the validation report. */
export function ValidationMenu({
  view,
  open,
  setOpen,
}: {
  view: SaveView;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const warnings = view.unresolved ? 1 : 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-sm px-2 py-0.5 hover:bg-accent hover:text-accent-foreground ${open ? "bg-accent text-accent-foreground" : ""}`}
      >
        <span className="text-success">✓</span>
        <span className={warnings ? "text-warning" : "text-subtle-foreground"}>
          ! {warnings}
        </span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-30 mt-1 w-[380px] space-y-4 rounded-sm border border-input bg-popover p-4 text-popover-foreground shadow-2xl">
            <Section title={t("validation.rejectChecks")}>
              <p className="text-success">✓ {t("validation.rejectPassed")}</p>
            </Section>
            <Section title={t("validation.warnings")}>
              {view.unresolved ? (
                <p className="flex gap-1.5 text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {t("validation.unresolved", { count: view.unresolved })}
                </p>
              ) : (
                <p className="text-success">✓ {t("validation.none")}</p>
              )}
            </Section>
            <Section title={t("validation.legality")}>
              <p className="text-subtle-foreground">
                {t("validation.legalityPending")}
              </p>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[12px] tracking-widest text-subtle-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
