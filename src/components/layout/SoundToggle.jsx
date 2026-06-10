"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useSoundPreference } from "@/hooks/useSoundPreference";

export default function SoundToggle({ className = "" }) {
  const { t } = useTranslation();
  const { isSoundEnabled, toggleSound } = useSoundPreference();
  const Icon = isSoundEnabled ? Volume2 : VolumeX;

  return (
    <button
      aria-label={isSoundEnabled ? t("toggles.soundOff") : t("toggles.soundOn")}
      aria-pressed={isSoundEnabled}
      className={className}
      onClick={toggleSound}
      type="button"
    >
      <span className="sr-only">{t("toggles.soundToggle")}</span>
      <Icon aria-hidden="true" className="pc-icon" strokeWidth={2.2} />
    </button>
  );
}
