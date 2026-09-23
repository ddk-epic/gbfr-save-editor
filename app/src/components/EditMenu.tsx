import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface EditAction {
  label: string;
  run: () => void;
}

export function EditMenu({ actions }: { actions: EditAction[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const empty = actions.length === 0;
  if (open && empty) setOpen(false);

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
        disabled={empty}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-sm px-1.5 text-[12px] tracking-widest text-subtle-foreground uppercase enabled:hover:bg-accent enabled:hover:text-accent-foreground disabled:opacity-40 ${open ? "bg-accent text-accent-foreground" : ""}`}
      >
        {t("edit.menu")} <ChevronDown size={12} />
      </button>
      {open && !empty && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <ul className="absolute top-full right-0 z-30 mt-1 min-w-50 rounded-sm border border-input bg-popover py-1 text-popover-foreground shadow-2xl">
            {actions.map((action) => (
              <li key={action.label}>
                <button
                  onClick={() => {
                    setOpen(false);
                    action.run();
                  }}
                  className="w-full px-3 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
