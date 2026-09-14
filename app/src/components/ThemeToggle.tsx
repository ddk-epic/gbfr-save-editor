import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolbarButton } from "./ToolbarButton";

const THEMES = [
  { key: "dark", icon: <Moon size={13} /> },
  { key: "light", icon: <Sun size={13} /> },
  { key: "system", icon: <Monitor size={13} /> },
] as const;

export function ThemeToggle() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const theme = THEMES[index]!;

  useEffect(() => {
    const root = document.documentElement;
    if (theme.key !== "system") {
      root.classList.toggle("dark", theme.key === "dark");
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.classList.toggle("dark", query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [theme.key]);

  return (
    <ToolbarButton
      onClick={() => setIndex((index + 1) % THEMES.length)}
      title={t("toolbar.theme")}
    >
      <span className="flex w-[9ch] items-center justify-center gap-1">
        {theme.icon} {t(`toolbar.themes.${theme.key}`)}
      </span>
    </ToolbarButton>
  );
}
