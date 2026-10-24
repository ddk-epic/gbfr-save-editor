import { Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadErrorText } from "../issues/LoadErrorText";
import { openFile, pickFile } from "../state/actions";
import { useLoadError } from "../state/save";
import { NEWS } from "./news";

export function WelcomePage() {
  const { t } = useTranslation();
  const loadError = useLoadError();
  const [dragging, setDragging] = useState(false);

  return (
    <div className="py-6">
      <h1 className="text-2xl text-strong-foreground">{t("welcome.title")}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <button
            onClick={pickFile}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) void openFile(file);
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
          <h2 className="mb-3 text-[12px] tracking-widest text-subtle-foreground uppercase">
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
