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
        className={`flex items-center gap-1 rounded-sm px-1.5 text-[12px] tracking-widest text-subtle-foreground uppercase hover:bg-accent hover:text-accent-foreground ${open ? "bg-accent text-accent-foreground" : ""}`}
      >
        {t("edit.menu")} <ChevronDown size={12} />
      </button>
      {open && (
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
