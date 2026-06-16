"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { APP_NAME, DEFAULT_PLAYABLE_WATER_COLORS } from "@/lib/constants";

const WHEEL_CHARS = "POURCISION";
const TARGET_SLOT_INDEX = 3;
const BLANK_SLOT_TOP = 0;
const BLANK_SLOT_BOTTOM = 6;
const COLOR_CARD_STAGGER = 0.085;
const COLOR_CARD_DURATION = 0.78;
const COLOR_CARD_INTRO_END = 1.64;
const TITLE_FILL_SELECTOR = [
  "[data-home-title-fill]",
  "[data-setup-title-fill]",
  "[data-room-title-fill]",
  "[data-results-title-fill]",
].join(",");

let hasPlayedEntryIntro = false;

function isEntryIntroPath(pathname) {
  if (!pathname) return false;

  const segments = pathname.split("/").filter(Boolean);

  return pathname === "/" || (segments.length === 1 && /^\d{6}$/.test(segments[0]));
}

function shouldPlayIntro(pathname) {
  return !hasPlayedEntryIntro && isEntryIntroPath(pathname);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function finishIntro(setVisible, pathname = window.location.pathname) {
  delete document.documentElement.dataset.pageIntroPending;
  hasPlayedEntryIntro = true;
  window.__pourcisionPageIntroDoneForPath = pathname;
  window.dispatchEvent(new CustomEvent("pourcision-page-intro-complete"));
  setVisible(false);
}

function getWheelStack(letter, index) {
  const chars = WHEEL_CHARS.split("");
  const offset = (index * 3) % chars.length;

  return [
    "",
    chars[(offset + 5) % chars.length],
    chars[(offset + 2) % chars.length],
    letter,
    chars[(offset + 7) % chars.length],
    chars[(offset + 4) % chars.length],
    "",
  ];
}

function shuffleIndexes(length) {
  return Array.from({ length }, (_, index) => index).sort(
    () => Math.random() - 0.5,
  );
}

function readViewportBox() {
  const visualViewport = window.visualViewport;
  const width =
    visualViewport?.width ||
    document.documentElement.clientWidth ||
    window.innerWidth;
  const height =
    visualViewport?.height ||
    document.documentElement.clientHeight ||
    window.innerHeight;
  const left = visualViewport?.offsetLeft || 0;
  const top = visualViewport?.offsetTop || 0;

  return {
    height,
    left,
    top,
    width,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTitleFillClip(viewport) {
  const titleFill = document.querySelector(TITLE_FILL_SELECTOR);
  if (!titleFill) {
    return "inset(0px 100% 100% 0px)";
  }

  const rect = titleFill.getBoundingClientRect();
  const top = clamp(rect.top - viewport.top, 0, viewport.height);
  const right = clamp(
    viewport.left + viewport.width - rect.right,
    0,
    viewport.width,
  );
  const bottom = clamp(
    viewport.top + viewport.height - rect.bottom,
    0,
    viewport.height,
  );
  const left = clamp(rect.left - viewport.left, 0, viewport.width);

  return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
}

export default function PageIntro() {
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const blackLayerRef = useRef(null);
  const wordRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const titleText = APP_NAME.toUpperCase();
  const letters = useMemo(
    () =>
      titleText.split("").map((letter, index) => ({
        id: `${letter}-${index}`,
        letter,
        stack: getWheelStack(letter, index),
      })),
    [titleText],
  );

  useLayoutEffect(() => {
    if (!shouldPlayIntro(pathname) || prefersReducedMotion()) {
      delete document.documentElement.dataset.pageIntroPending;
      if (isEntryIntroPath(pathname)) {
        hasPlayedEntryIntro = true;
      }
      window.__pourcisionPageIntroDoneForPath = pathname;
      window.dispatchEvent(new CustomEvent("pourcision-page-intro-complete"));
      const hideFrame = window.requestAnimationFrame(() => setVisible(false));
      return () => window.cancelAnimationFrame(hideFrame);
    }

    let mountFrame = 0;
    let playFrame = 0;
    let timeline;

    document.documentElement.dataset.pageIntroPending = "true";
    window.dispatchEvent(new CustomEvent("pourcision-page-intro-start"));

    mountFrame = window.requestAnimationFrame(() => {
      setVisible(true);

      playFrame = window.requestAnimationFrame(() => {
        const overlay = overlayRef.current;
        const blackLayer = blackLayerRef.current;
        const word = wordRef.current;
        if (!overlay || !blackLayer || !word) {
          finishIntro(setVisible, pathname);
          return;
        }

        const letterNodes = Array.from(
          word.querySelectorAll("[data-intro-letter]"),
        );
        const wheelNodes = Array.from(
          word.querySelectorAll("[data-intro-wheel]"),
        );
        const colorCards = Array.from(
          overlay.querySelectorAll("[data-intro-color-card]"),
        );
        const colorLeftPanels = Array.from(
          overlay.querySelectorAll("[data-intro-color-left]"),
        );
        const colorRightPanels = Array.from(
          overlay.querySelectorAll("[data-intro-color-right]"),
        );
        const enterOrder = shuffleIndexes(letterNodes.length);
        const exitOrder = shuffleIndexes(letterNodes.length);
        const wheelDirections = wheelNodes.map((_, index) =>
          index % 2 === 0 ? "top" : "bottom",
        );
        const slotHeights = letterNodes.map(
          (node) => node.getBoundingClientRect().height,
        );
        const getSlotY = (letterIndex, slotIndex) =>
          -slotHeights[letterIndex] * slotIndex;
        const viewport = readViewportBox();

        timeline = gsap.timeline({
          defaults: { ease: "expo.inOut" },
          onComplete: () => {
            gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });

            finishIntro(setVisible, pathname);
          },
        });

        gsap.set(overlay, {
          autoAlpha: 1,
          pointerEvents: "auto",
        });
        gsap.set(blackLayer, {
          autoAlpha: 1,
          backgroundColor: "#020202",
          borderRadius: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          height: viewport.height,
          left: viewport.left,
          position: "fixed",
          top: viewport.top,
          transformOrigin: "left top",
          width: viewport.width,
          willChange: "clip-path,opacity",
          x: 0,
          y: 0,
        });
        delete document.documentElement.dataset.pageIntroPending;

        timeline
          .set(colorCards, {
            autoAlpha: 1,
          })
          .set(colorLeftPanels, {
            xPercent: 0,
            transformOrigin: "right center",
          })
          .set(colorRightPanels, {
            xPercent: 0,
            transformOrigin: "left center",
          })
          .set(letterNodes, {
            autoAlpha: 0,
            filter: "blur(0px)",
            scaleY: 1,
            y: 0,
          })
          .set(wheelNodes, {
            yPercent: 0,
            y: (index) =>
              wheelDirections[index] === "top"
                ? getSlotY(index, BLANK_SLOT_TOP)
                : getSlotY(index, BLANK_SLOT_BOTTOM),
          });

        colorCards.forEach((card, index) => {
          const startAt = index * COLOR_CARD_STAGGER;

          timeline.to(
            colorLeftPanels[index],
            {
              duration: COLOR_CARD_DURATION,
              ease: "expo.inOut",
              xPercent: -102,
            },
            startAt,
          );
          timeline.to(
            colorRightPanels[index],
            {
              duration: COLOR_CARD_DURATION,
              ease: "expo.inOut",
              xPercent: 102,
            },
            startAt,
          );
          timeline.set(card, { autoAlpha: 0 }, startAt + COLOR_CARD_DURATION);
        });

        timeline.set(letterNodes, { autoAlpha: 1 }, COLOR_CARD_INTRO_END);

        enterOrder.forEach((letterIndex, orderIndex) => {
          const wheelNode = wheelNodes[letterIndex];
          const startAt =
            COLOR_CARD_INTRO_END +
            0.18 +
            orderIndex * 0.055 +
            Math.random() * 0.12;

          timeline.to(
            wheelNode,
            {
              duration: 0.86,
              y: getSlotY(letterIndex, TARGET_SLOT_INDEX),
              yPercent: 0,
            },
            startAt,
          );
        });

        exitOrder.forEach((letterIndex, orderIndex) => {
          const wheelNode = wheelNodes[letterIndex];
          const exitToBottom = (letterIndex + orderIndex) % 2 === 0;
          const startAt =
            COLOR_CARD_INTRO_END +
            2.25 +
            orderIndex * 0.052 +
            Math.random() * 0.08;

          timeline.to(
            wheelNode,
            {
              duration: 0.76,
              y: exitToBottom
                ? getSlotY(letterIndex, BLANK_SLOT_BOTTOM)
                : getSlotY(letterIndex, BLANK_SLOT_TOP),
              yPercent: 0,
            },
            startAt,
          );
        });

        timeline.set(word, { autoAlpha: 0 }, COLOR_CARD_INTRO_END + 3.62);

        timeline.to(
          blackLayer,
          {
            clipPath: getTitleFillClip(viewport),
            duration: 1.08,
            ease: "power3.inOut",
          },
          COLOR_CARD_INTRO_END + 3.65,
        );

        timeline.set(blackLayer, { autoAlpha: 0 }, ">");
      });
    });

    return () => {
      window.cancelAnimationFrame(mountFrame);
      window.cancelAnimationFrame(playFrame);
      timeline?.kill();
      delete document.documentElement.dataset.pageIntroPending;
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-[9999] overflow-hidden text-[#f7f7f2]"
      data-page-intro-overlay="true"
      ref={overlayRef}
    >
      <div
        className="fixed left-0 top-0 h-dvh w-screen bg-[#020202] will-change-[clip-path,opacity]"
        data-page-intro-black-layer="true"
        ref={blackLayerRef}
      />

      <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
        {DEFAULT_PLAYABLE_WATER_COLORS.map((color, index) => (
          <div
            className="absolute inset-0 overflow-hidden"
            data-intro-color-card="true"
            key={color.id}
            style={{ zIndex: DEFAULT_PLAYABLE_WATER_COLORS.length - index }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/2 will-change-transform"
              data-intro-color-left="true"
              data-premium-water={color.animated ? "true" : undefined}
              style={{ background: color.background || color.value }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-1/2 will-change-transform"
              data-intro-color-right="true"
              data-premium-water={color.animated ? "true" : undefined}
              style={{ background: color.background || color.value }}
            />
          </div>
        ))}
      </div>

      <h1
        className="fixed left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0 overflow-hidden px-6 text-center font-black uppercase leading-[0.82] tracking-normal"
        ref={wordRef}
        style={{
          fontSize:
            "min(clamp(2.05rem, 10.5vw, 11rem), calc((100vw - 3rem) / 6.8))",
        }}
      >
        {letters.map((item) => (
          <span
            className="relative inline-block h-[0.88em] overflow-hidden align-top opacity-0"
            data-intro-letter="true"
            key={item.id}
          >
            <span
              aria-hidden="true"
              className="invisible block h-[0.88em] leading-[0.88em]"
            >
              {item.letter}
            </span>
            <span
              className="absolute left-1/2 top-0 block -translate-x-1/2"
              data-intro-wheel="true"
            >
              {item.stack.map((stackLetter, stackIndex) => (
                <span
                  className="block h-[0.88em] text-center leading-[0.88em]"
                  key={`${item.id}-${stackLetter}-${stackIndex}`}
                >
                  {stackLetter || "\u00a0"}
                </span>
              ))}
            </span>
          </span>
        ))}
      </h1>
    </div>
  );
}
