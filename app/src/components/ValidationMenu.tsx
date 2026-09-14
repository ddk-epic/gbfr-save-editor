import { AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, type ReactNode } from "react";
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
        <span className={warnings ? "text-warning" : "text-subtle-foreground"}>! {warnings}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-30 mt-1 w-[380px] space-y-4 rounded-sm border border-input bg-popover p-4 text-popover-foreground shadow-2xl">
            <Section title="Reject checks">
              <p className="text-success">✓ header, section bounds, footer, both FlatBuffers decode</p>
            </Section>
            <Section title="Warnings">
              {view.unresolved ? (
                <p className="flex gap-1.5 text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {view.unresolved} keys missing from the key tables, shown as # and hex
                </p>
              ) : (
                <p className="text-success">✓ none</p>
              )}
            </Section>
            <Section title="Legality">
              <p className="text-subtle-foreground">Checked once editing arrives. Nothing is verified yet.</p>
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
      <h2 className="mb-2 text-[11px] tracking-widest text-subtle-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}
