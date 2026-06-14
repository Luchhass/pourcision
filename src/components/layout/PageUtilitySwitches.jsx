"use client";

import { useState } from "react";
import SoundToggle from "@/components/layout/SoundToggle";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useTranslation } from "@/hooks/useLanguage";
import { playActiveScreenExit } from "@/hooks/useScreenReveal";

export default function PageUtilitySwitches({ placement = "inline", tone = "dark" }) {
  const { locale, nextLocale, setLanguage, t } = useTranslation();
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const isRail = placement === "rail";
  const switchClass =
    tone === "light"
      ? "text-[#f7f7f2] focus-visible:outline-[#f7f7f2] dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
      : "text-[#0d0d0c] focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]";
  const sectionClass = isRail
    ? "pointer-events-auto fixed right-0 top-[5.25rem] z-50 md:top-28 lg:absolute lg:top-24"
    : "flex justify-end";
  const switchGroupClass = isRail ? "grid gap-0" : "flex gap-2";
  const railButtonClass =
    tone === "cream"
      ? "pc-icon-button grid place-items-center bg-[#f7f7f2] text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f7f2] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
      : "pc-icon-button grid place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#202020] dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]";
  const buttonClass = isRail
    ? railButtonClass
    : `pc-icon-button grid place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${switchClass}`;
  const handleLanguageSwitch = async () => {
    if (isSwitchingLanguage) return;

    setIsSwitchingLanguage(true);

    try {
      await playActiveScreenExit();
      setLanguage(nextLocale);
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  return (
    <section className={sectionClass} data-utility-placement={placement}>
      <div className={switchGroupClass}>
        <button
          aria-label={t("utility.language")}
          className={buttonClass}
          disabled={isSwitchingLanguage}
          onClick={handleLanguageSwitch}
          type="button"
        >
          <span className="pc-choice-text">{locale.toUpperCase()}</span>
        </button>
        <SoundToggle className={buttonClass} />
        <ThemeToggle className={buttonClass} />
      </div>
    </section>
  );
}
