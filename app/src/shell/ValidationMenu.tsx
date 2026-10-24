import type { SaveIssue } from "gbfr-save-editor";
import { AlertTriangle, ChevronDown, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ValidationIssueText } from "../issues/ValidationIssueText";
import { useSave } from "../state/save";

const NO_ISSUES: SaveIssue[] = [];

/** Title bar summary of the validation report. */
export function ValidationMenu() {
  const unresolved = useSave((save) => save?.view.unresolved);
  if (unresolved === undefined) return null;
  return <Menu unresolved={unresolved} />;
}

function Menu({ unresolved }: { unresolved: number }) {
  const { t } = useTranslation();
  const issues = useSave((save) => save?.issues ?? NO_ISSUES);
  const [open, setOpen] = useState(false);
  const rejects = issues.filter((issue) => issue.severity === "reject");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  // Unresolved keys count as one warning.
  const warningCount = warnings.length + (unresolved ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-sm px-2 py-0.5 hover:bg-accent hover:text-accent-foreground ${open ? "bg-accent text-accent-foreground" : ""}`}
      >
        <span className={rejects.length ? "text-destructive" : "text-success"}>
          {rejects.length ? `× ${rejects.length}` : "✓"}
        </span>
        <span
          className={warningCount ? "text-warning" : "text-subtle-foreground"}
        >
          ! {warningCount}
        </span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-30 mt-1 max-h-[70vh] w-[380px] space-y-4 overflow-y-auto rounded-sm border border-input bg-popover p-4 text-popover-foreground shadow-2xl">
            <Section title={t("validation.rejectChecks")}>
              {rejects.length ? (
                <IssueList issues={rejects} reject />
              ) : (
                <p className="text-success">✓ {t("validation.rejectPassed")}</p>
              )}
            </Section>
            <Section title={t("validation.warnings")}>
              {unresolved ? (
                <p className="flex gap-1.5 text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {t("validation.unresolved", { count: unresolved })}
                </p>
              ) : null}
              {warnings.length ? <IssueList issues={warnings} /> : null}
              {warningCount ? null : (
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

function IssueList({
  issues,
  reject,
}: {
  issues: SaveIssue[];
  reject?: boolean;
}) {
  const Icon = reject ? XCircle : AlertTriangle;
  return (
    <ul className={`space-y-1 ${reject ? "text-destructive" : "text-warning"}`}>
      {issues.map((issue, i) => (
        <li key={`${issue.code}-${i}`} className="flex gap-1.5">
          <Icon size={13} className="mt-0.5 shrink-0" />
          <ValidationIssueText issue={issue} />
        </li>
      ))}
    </ul>
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
