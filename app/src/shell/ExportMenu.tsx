import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { download } from "../state/actions";
import { useSave } from "../state/save";
import { ToolbarButton } from "../ui/ToolbarButton";

export function ExportMenu() {
  const { t } = useTranslation();
  // Undefined while there is nothing to export.
  const fileName = useSave((save) =>
    save?.edited ? save.fileName : undefined,
  );
  const [open, setOpen] = useState(false);
  if (open && fileName === undefined) setOpen(false);
  const shown = open && fileName !== undefined;

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  return (
    <div className="relative">
      <ToolbarButton
        disabled={fileName === undefined}
        onClick={() => setOpen(!open)}
        className={shown ? "bg-accent text-accent-foreground" : ""}
      >
        <Download size={13} /> {t("toolbar.export")}
      </ToolbarButton>
      {shown && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-30 mt-1 w-[320px] space-y-3 rounded-sm border border-input bg-popover p-4 text-popover-foreground shadow-2xl">
            <p className="text-subtle-foreground">
              {t("export.description", { fileName })}
            </p>
            <button
              onClick={() => {
                setOpen(false);
                download();
              }}
              className="flex items-center gap-1.5 rounded-sm border border-input px-3 py-1 hover:bg-accent hover:text-accent-foreground"
            >
              <Download size={13} /> {t("export.download")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
