"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import { useRedeemCodes } from "@/hooks/useRedeemCodes";
import { useModalMotion } from "@/hooks/useModalMotion";

export default function RedeemCodeModal({ onClose }) {
  const { t } = useTranslation();
  const { hasPremiumWaterColors, redeemCode } = useRedeemCodes();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const displayedMessage = hasPremiumWaterColors ? t("redeem.success") : message;
  const { closeWithAnimation, isClosing, overlayRef, panelRef } =
    useModalMotion({
      itemSelector: "[data-redeem-reveal-item]",
      onClose,
      rowSelector: "[data-redeem-reveal-row]",
    });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeWithAnimation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWithAnimation]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = redeemCode(code);
    setMessage(result.ok ? t("redeem.success") : t("redeem.error"));
    if (result.ok) {
      setCode("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#0d0d0c]/45 p-4 opacity-0 backdrop-blur-[2px]"
      ref={overlayRef}
    >
      <button
        aria-label={t("redeem.close")}
        className="absolute inset-0 cursor-default"
        disabled={isClosing}
        onClick={closeWithAnimation}
        type="button"
      />
      <section
        className="relative z-10 grid w-full max-w-[min(28rem,calc(100vw-2rem))] min-w-0 gap-6 overflow-hidden bg-[#f7f7f2] p-5 text-[#0d0d0c] dark:bg-[#161616] dark:text-[#f7f7f2]"
        ref={panelRef}
      >
        <div className="flex min-w-0 items-start justify-between gap-5">
          <div className="min-w-0">
            <p
              className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58"
              data-redeem-reveal-row="true"
            >
              <span className="block" data-redeem-reveal-item="true">
                {t("redeem.kicker")}
              </span>
            </p>
            <h2
              className="mt-3 text-4xl font-black uppercase leading-none tracking-normal sm:text-5xl"
              data-redeem-reveal-row="true"
            >
              <span className="block" data-redeem-reveal-item="true">
                {t("redeem.title")}
              </span>
            </h2>
          </div>
          <div data-redeem-reveal-row="true">
            <button
              aria-label={t("redeem.close")}
              className="grid size-10 shrink-0 place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
              data-redeem-reveal-item="true"
              disabled={isClosing}
              onClick={closeWithAnimation}
              type="button"
            >
              <X aria-hidden="true" className="pc-icon" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <p
          className="max-w-[22rem] text-lg font-bold leading-snug text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58"
          data-redeem-reveal-row="true"
        >
          <span className="block" data-redeem-reveal-item="true">
            {t("redeem.description")}
          </span>
        </p>

        <form className="grid min-w-0 gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-3" data-redeem-reveal-row="true">
            <span
              className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58"
              data-redeem-reveal-item="true"
            >
              {t("redeem.inputLabel")}
            </span>
            <input
              autoComplete="off"
              className="h-[var(--pc-choice-height)] w-full bg-[#0d0d0c]/8 px-5 text-lg font-black text-[#0d0d0c] outline-none transition-colors duration-200 placeholder:text-[#0d0d0c]/42 focus:bg-[#0d0d0c]/12 dark:bg-[#f7f7f2]/10 dark:text-[#f7f7f2] dark:placeholder:text-[#f7f7f2]/42 dark:focus:bg-[#f7f7f2]/14"
              data-redeem-reveal-item="true"
              onChange={(event) => setCode(event.target.value)}
              placeholder={t("redeem.placeholder")}
              value={code}
            />
          </label>

          {displayedMessage ? (
            <p
              className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58"
              data-redeem-reveal-row="true"
            >
              <span data-redeem-reveal-item="true">{displayedMessage}</span>
            </p>
          ) : null}

          <div data-redeem-reveal-row="true">
            <Button
              className="rounded-none"
              data-redeem-reveal-item="true"
              disabled={isClosing}
              type="submit"
            >
              {t("redeem.submit")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
