import { FileBox } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { go } from "../state/navigation";
import { useSave } from "../state/save";

/** Full-width bars whose content lines up with the page column. */
function Bar({
  gutter,
  className,
  children,
}: {
  gutter: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={className} style={{ paddingInline: gutter }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6">
        {children}
      </div>
    </div>
  );
}

export function TitleBar({
  gutter,
  children,
}: {
  gutter: number;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const fileName = useSave((save) => save?.fileName);
  return (
    // Above the pages' sticky headers.
    <Bar
      gutter={gutter}
      className="relative z-200 border-b border-border bg-card py-1.5 text-card-foreground"
    >
      <button
        onClick={() => go("welcome")}
        className="flex items-center gap-3 text-strong-foreground hover:text-primary"
      >
        <FileBox size={15} className="text-primary" />
        {t("app.name")}
      </button>
      <span className="text-subtle-foreground">
        — {fileName ?? t("app.noFile")}
      </span>
      <div className="ml-auto flex gap-1">{children}</div>
    </Bar>
  );
}

export function StatusBar({ gutter }: { gutter: number }) {
  const { t } = useTranslation();
  const view = useSave((save) => save?.view);
  return (
    <Bar
      gutter={gutter}
      className="bg-status py-0.5 text-[13px] text-status-foreground"
    >
      {view ? (
        <>
          <span>
            {t("status.slotVersion", { version: view.slotVersion ?? "?" })}
          </span>
          <span>
            {t("status.characters", { count: view.characters.length })}
          </span>
          <span className={view.unresolved ? "font-bold" : ""}>
            {t("status.unresolved", { count: view.unresolved })}
          </span>
        </>
      ) : (
        <span>{t("app.noFile")}</span>
      )}
      <span className="ml-auto">{t("status.readOnly")}</span>
    </Bar>
  );
}
