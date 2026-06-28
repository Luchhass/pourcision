"use client";

import { Music4 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useMusicPreference } from "@/hooks/useMusicPreference";

export default function MusicToggle({ className = "" }) {
  const { t } = useTranslation();
  const { isMusicEnabled, toggleMusic } = useMusicPreference();

  return (
    <button
      aria-label={isMusicEnabled ? t("toggles.musicOff") : t("toggles.musicOn")}
      aria-pressed={isMusicEnabled}
      className={className}
      onClick={toggleMusic}
      type="button"
    >
      <span className="sr-only">{t("toggles.musicToggle")}</span>
      <span className="relative grid place-items-center">
        <Music4 aria-hidden="true" className="pc-icon" strokeWidth={2.2} />
        {!isMusicEnabled ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-[2px] w-[1.9rem] rotate-[-45deg] bg-current"
            data-utility-reveal-item
          />
        ) : null}
      </span>
    </button>
  );
}
