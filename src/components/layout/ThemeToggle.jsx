"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className = "" }) {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      aria-label={isDark ? t("toggles.themeLight") : t("toggles.themeDark")}
      aria-pressed={isDark}
      className={className}
      onClick={toggleTheme}
      suppressHydrationWarning
      type="button"
    >
      <span className="sr-only">{t("toggles.themeToggle")}</span>
      <Icon aria-hidden="true" className="pc-icon" strokeWidth={2.2} />
    </button>
  );
}
