import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../i18n/game-text";
import { editError, useEditError } from "../state/save";

/** The last failed edit's message, dismissible. */
export function EditErrorNotice() {
  const { t } = useTranslation();
  const gt = useGameText();
  const error = useEditError();
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-border bg-card px-6 py-1.5 text-destructive"
    >
      <p className="min-w-0 flex-1">
        {t("editErrors.failed")} {error.message}
      </p>
      <button
        onClick={() => editError.set(undefined)}
        aria-label={gt("ui", "close") ?? t("editErrors.dismiss")}
        title={gt("ui", "close") ?? t("editErrors.dismiss")}
        className="rounded-sm p-0.5 hover:bg-accent hover:text-accent-foreground"
      >
        <X size={13} />
      </button>
    </div>
  );
}
