import { Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NEWS } from "../content";
import { LoadErrorText } from "../components/LoadErrorText";
import type { LoadError } from "../save/load";

export function WelcomePage({
  loadError,
  onPick,
  onFile,
}: {
  loadError: LoadError | undefined;
  onPick: () => void;
  onFile: (file: File) => void;
}) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);

  return (
    <div className="py-6">
      <h1 className="text-2xl text-strong-foreground">{t("welcome.title")}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <button
            onClick={onPick}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
            className={`flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed py-8 ${
              dragging
                ? "border-primary text-primary"
                : "border-input text-muted-foreground hover:border-primary hover:text-strong-foreground"
            }`}
          >
            <Upload size={20} />
            {t("welcome.drop")}
          </button>
          {loadError && (
            <p className="mt-2 text-destructive">
              <LoadErrorText error={loadError} />
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-[11px] tracking-widest text-subtle-foreground uppercase">
            {t("welcome.news")}
          </h2>
          <ul className="space-y-4">
            {NEWS.map((item) => (
              <li key={item.title}>
                <span className="text-primary">{item.date}</span>{" "}
                <span className="text-strong-foreground">{item.title}</span>
                <p className="font-sans text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
