"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useTranslation } from "@/hooks/useLanguage";

const STABLE_REVEAL_TRANSFORM = { force3D: false };

export default function AnimatedSettingsModal({ children, onClose, title }) {
  const { t } = useTranslation();
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const timelineRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const closeWithAnimation = useCallback(() => {
    if (isClosing) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;
    setIsClosing(true);
    timelineRef.current?.kill();

    timelineRef.current = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: onClose,
    });

    timelineRef.current
      .to(panel, {
        autoAlpha: 0,
        duration: 0.16,
        ...STABLE_REVEAL_TRANSFORM,
        y: 8,
      })
      .to(
        overlay,
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        "<",
      );
  }, [isClosing, onClose]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return undefined;

    const rows = panel.querySelectorAll("[data-modal-reveal-row]");
    const rowItems = panel.querySelectorAll("[data-modal-reveal-item]");

    timelineRef.current?.kill();
    timelineRef.current = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => {
        gsap.set(panel, { clearProps: "clipPath,willChange" });
        gsap.set(rows, { clearProps: "overflow" });
        gsap.set(rowItems, { clearProps: "autoAlpha,willChange" });
      },
    });

    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(panel, {
      autoAlpha: 1,
      clipPath: "inset(0 0 100% 0)",
      ...STABLE_REVEAL_TRANSFORM,
      willChange: "clip-path",
      y: 14,
    });
    gsap.set(rows, { overflow: "hidden" });
    gsap.set(rowItems, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -112,
    });

    timelineRef.current
      .to(overlay, {
        autoAlpha: 1,
        duration: 0.16,
        ease: "power2.out",
      })
      .to(
        panel,
        {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.34,
          ...STABLE_REVEAL_TRANSFORM,
          y: 0,
        },
        "<0.03",
      )
      .to(
        rowItems,
        {
          autoAlpha: 1,
          duration: 0.36,
          ...STABLE_REVEAL_TRANSFORM,
          stagger: 0.035,
          yPercent: 0,
        },
        "-=0.16",
      );

    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeWithAnimation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWithAnimation]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-[#0d0d0c]/45 p-4 opacity-0 backdrop-blur-[2px] md:hidden"
      ref={overlayRef}
    >
      <button
        aria-label={t("room.closeSettings")}
        className="absolute inset-0 cursor-default"
        disabled={isClosing}
        onClick={closeWithAnimation}
        type="button"
      />
      <section
        className="relative z-10 grid w-full max-w-[min(26rem,calc(100vw-2rem))] min-w-0 gap-6 overflow-hidden bg-[#f7f7f2] p-5 text-[#0d0d0c] shadow-[0_28px_80px_rgba(13,13,12,0.34)] dark:bg-[#161616] dark:text-[#f7f7f2]"
        ref={panelRef}
      >
        <div className="flex min-w-0 items-start justify-between gap-5">
          <h2
            className="pc-label text-[#0d0d0c]/70 dark:text-[#f7f7f2]/70"
            data-modal-reveal-row="true"
          >
            <span className="block" data-modal-reveal-item="true">
              {title}
            </span>
          </h2>
          <div data-modal-reveal-row="true">
            <button
              aria-label={t("room.closeSettings")}
              className="grid size-10 shrink-0 place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
              data-modal-reveal-item="true"
              disabled={isClosing}
              onClick={closeWithAnimation}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="pc-icon"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden" data-modal-reveal-row="true">
          <div className="min-w-0 overflow-hidden" data-modal-reveal-item="true">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
