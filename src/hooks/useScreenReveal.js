"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const TITLE_SELECTOR = '[data-screen-reveal="title"]';
const WATER_BG_SELECTOR = '[data-screen-reveal="water-bg"]';
const CREAM_SELECTOR = '[data-screen-reveal="cream"]';
const WATER_CONTENT_SELECTOR = '[data-screen-reveal="water-content"]';
const REVEAL_ROW_SELECTOR = "[data-screen-reveal-row]";
const REVEAL_LINE_ROW_SELECTOR = "[data-screen-reveal-line-row]";
const INTRO_COMPLETE_EVENT = "pourcision-page-intro-complete";
const ACTIVE_SCREEN_EXIT_EVENT = "pourcision-active-screen-exit";
const INTRO_SETTLE_DELAY = 120;
const INTRO_TIMEOUT = 6200;
const INTRO_APPEAR_WAIT = 240;
const WATER_BG_REVEALED_KEY = "__pourcisionWaterBgRevealedOnce";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasRevealedWaterBackground() {
  return Boolean(window[WATER_BG_REVEALED_KEY]);
}

function markWaterBackgroundRevealed() {
  window[WATER_BG_REVEALED_KEY] = true;
}

function waitForIntro(callback) {
  if (window.__pourcisionPageIntroDoneForPath) {
    const settleId = window.setTimeout(callback, 90);
    return () => window.clearTimeout(settleId);
  }

  const overlay = document.querySelector("[data-page-intro-overlay]");
  const introPending =
    document.documentElement.dataset.pageIntroPending === "true";
  let completed = false;
  let fallbackId = null;
  let settleId = null;
  let observer = null;

  function cleanup() {
    window.removeEventListener(INTRO_COMPLETE_EVENT, handleComplete);
    observer?.disconnect();
    observer = null;
    if (fallbackId) window.clearTimeout(fallbackId);
    fallbackId = null;
  }

  function finish(delay = 0) {
    if (completed) return;

    completed = true;
    cleanup();
    settleId = window.setTimeout(callback, delay);
  }

  function handleComplete() {
    finish(INTRO_SETTLE_DELAY);
  }

  const armFallback = () => {
    if (fallbackId) window.clearTimeout(fallbackId);
    fallbackId = window.setTimeout(
      () => finish(INTRO_SETTLE_DELAY),
      INTRO_TIMEOUT,
    );
  };

  window.addEventListener(INTRO_COMPLETE_EVENT, handleComplete, { once: true });

  if (overlay || introPending) {
    armFallback();
  } else {
    let sawOverlay = false;

    observer = new MutationObserver(() => {
      if (sawOverlay) return;

      const nextOverlay = document.querySelector("[data-page-intro-overlay]");
      if (!nextOverlay) return;

      sawOverlay = true;
      armFallback();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    fallbackId = window.setTimeout(() => {
      if (!sawOverlay) finish(70);
    }, INTRO_APPEAR_WAIT);
  }

  return () => {
    cleanup();
    if (settleId) window.clearTimeout(settleId);
  };
}

function toArray(selector, scope) {
  return gsap.utils.toArray(selector, scope);
}

function getRevealChildren(element) {
  const children = Array.from(element.children).filter(
    (child) => child instanceof HTMLElement,
  );

  return children.length ? children : [element];
}

function restoreParagraphLineReveal(paragraph) {
  if (paragraph.dataset.screenRevealDynamicLines !== "true") return;

  paragraph.innerHTML = paragraph.dataset.screenRevealOriginalHtml ?? "";
  paragraph.style.overflow = "";
  delete paragraph.dataset.screenRevealDynamicLines;
  delete paragraph.dataset.screenRevealOriginalHtml;
}

function isLineRevealParagraph(element) {
  if (!(element instanceof HTMLParagraphElement)) return false;
  if (element.dataset.screenRevealLine === "false") return false;
  if (!element.matches(REVEAL_ROW_SELECTOR)) return false;
  if (!element.classList.contains("pc-copy") && !element.closest(".pc-copy")) {
    return false;
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text.includes(" ");
}

function groupWordsByRenderedLine(wordSpans) {
  const lines = [];

  wordSpans.forEach((span) => {
    const rect = span.getBoundingClientRect();
    const top = Math.round(rect.top);
    const lastLine = lines[lines.length - 1];

    if (lastLine && Math.abs(lastLine.top - top) <= 2) {
      lastLine.words.push(span);
      return;
    }

    lines.push({ top, words: [span] });
  });

  return lines;
}

function prepareParagraphLineReveals(scope) {
  const paragraphs = Array.from(scope.querySelectorAll("p")).filter(
    isLineRevealParagraph,
  );

  paragraphs.forEach((paragraph) => {
    restoreParagraphLineReveal(paragraph);

    const text = paragraph.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!text) return;

    paragraph.dataset.screenRevealOriginalHtml = paragraph.innerHTML;
    paragraph.dataset.screenRevealDynamicLines = "true";
    paragraph.style.overflow = "visible";
    paragraph.textContent = "";

    const words = text.split(" ");
    const wordSpans = words.map((word, index) => {
      const span = document.createElement("span");
      span.textContent = index === words.length - 1 ? word : `${word} `;
      paragraph.appendChild(span);
      return span;
    });

    const lines = groupWordsByRenderedLine(wordSpans)
      .map((line) => line.words.map((span) => span.textContent).join("").trimEnd())
      .filter(Boolean);

    paragraph.textContent = "";

    lines.forEach((line) => {
      const outer = document.createElement("span");
      const inner = document.createElement("span");

      outer.dataset.screenRevealLineRow = "true";
      outer.className = "block overflow-hidden";
      inner.className = "block";
      inner.textContent = line;
      outer.appendChild(inner);
      paragraph.appendChild(outer);
    });
  });
}

function restoreParagraphLineReveals(scope) {
  Array.from(
    scope.querySelectorAll('[data-screen-reveal-dynamic-lines="true"]'),
  ).forEach((paragraph) => {
    if (paragraph instanceof HTMLParagraphElement) {
      restoreParagraphLineReveal(paragraph);
    }
  });
}

function getRevealRows(groups) {
  return groups.flatMap((group) => {
    const rows = Array.from(group.querySelectorAll(REVEAL_ROW_SELECTOR)).filter(
      (row) => row instanceof HTMLElement,
    );

    if (!rows.length) return getRevealChildren(group);

    return rows.flatMap((row) => {
      const lineRows = Array.from(
        row.querySelectorAll(REVEAL_LINE_ROW_SELECTOR),
      ).filter((lineRow) => lineRow instanceof HTMLElement);

      return lineRows.length ? lineRows : [row];
    });
  });
}

function getRevealItems(rows) {
  return rows.flatMap((row) => getRevealTargets(row));
}

function getRevealTargets(row) {
  if (row.dataset.screenRevealTarget === "self") return getRevealChildren(row);

  return row.dataset.screenRevealGroup === "stats" ? [row] : getRevealChildren(row);
}

function getRevealOwner(item) {
  return item.dataset.screenRevealRow ? item : item.parentElement;
}

function getRevealDirection(element, fallback = "down") {
  if (element.dataset.screenRevealDirection === "up") return "up";
  if (element.dataset.screenRevealDirection === "down") return "down";

  const owner = element.closest("[data-screen-reveal-direction]");
  if (owner?.dataset.screenRevealDirection === "up") return "up";
  if (owner?.dataset.screenRevealDirection === "down") return "down";

  return fallback;
}

function shouldMask(element) {
  return element.dataset.screenRevealMask !== "none";
}

function getMaskRows(rows) {
  return rows.filter((row) => shouldMask(row));
}

function isSectionWordRevealItem(item) {
  return !!item.closest("[data-screen-reveal-section-word]");
}

function getRevealY(element, fallback = "down") {
  return getRevealDirection(element, fallback) === "up" ? 24 : -24;
}

function getCreamRowDelay(row, index, meta) {
  if (row.dataset.screenRevealGroup === "stats") {
    return 0.34 + meta.groupIndex * 0.085;
  }

  return index * 0.075;
}

function revealRows(timeline, rows, startAt, options = {}) {
  const groupIndexes = {};

  rows.forEach((row, index) => {
    const items = getRevealTargets(row);
    const groupName = row.dataset.screenRevealGroup || "default";
    const groupIndex = groupIndexes[groupName] ?? 0;
    const isStats = groupName === "stats";
    const isSectionWord = items.some(isSectionWordRevealItem);
    const delay =
      options.delayForRow?.(row, index, { groupIndex, groupName }) ??
      index * (options.rowStagger ?? 0.05);

    groupIndexes[groupName] = groupIndex + 1;

    timeline.to(
      items,
      {
        autoAlpha: 1,
        clearProps: isSectionWord
          ? "opacity,visibility,willChange"
          : "opacity,visibility",
        duration: isStats ? 0.74 : options.duration ?? 0.62,
        ease: isStats ? "expo.out" : options.ease ?? "power4.out",
        y: 0,
      },
      `${startAt}+=${delay}`,
    );
  });
}

function getRevealParts(scope) {
  prepareParagraphLineReveals(scope);

  const titleGroups = toArray(TITLE_SELECTOR, scope);
  const waterBackgrounds = toArray(WATER_BG_SELECTOR, scope);
  const creamGroups = toArray(CREAM_SELECTOR, scope);
  const waterContentGroups = toArray(WATER_CONTENT_SELECTOR, scope);
  const titleLetters = titleGroups.flatMap((group) =>
    Array.from(group.querySelectorAll("h1")),
  );
  const creamRows = getRevealRows(creamGroups);
  const creamMaskRows = getMaskRows(creamRows);
  const creamItems = getRevealItems(creamRows);
  const waterContentRows = getRevealRows(waterContentGroups);
  const waterContentMaskRows = getMaskRows(waterContentRows);
  const waterContentItems = getRevealItems(waterContentRows);

  return {
    creamGroups,
    creamItems,
    creamMaskRows,
    creamRows,
    titleGroups,
    titleLetters,
    waterBackgrounds,
    waterContentGroups,
    waterContentItems,
    waterContentMaskRows,
    waterContentRows,
  };
}

export function useScreenReveal(scopeRef, dependencies = [], options = {}) {
  const timelineRef = useRef(null);
  const cancelIntroWaitRef = useRef(null);
  const cancelDelayRef = useRef(null);
  const hasPlayedInitialRevealRef = useRef(false);
  const shouldRevealWaterBgRef = useRef(false);

  const playExit = useCallback(() => {
    const scope = scopeRef.current;

    if (!scope || prefersReducedMotion()) {
      return Promise.resolve();
    }

    const {
      creamItems,
      titleLetters,
      waterContentItems,
    } = getRevealParts(scope);
    const fadeTargets = [
      ...titleLetters,
      ...creamItems,
      ...waterContentItems,
    ];

    timelineRef.current?.kill();
    cancelIntroWaitRef.current?.();
    cancelDelayRef.current?.();

    return new Promise((resolve) => {
      const exitTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: resolve,
      });

      exitTimeline.to(
        fadeTargets,
        {
          autoAlpha: 0,
          duration: 0.32,
          ease: "power2.out",
        },
        0,
      );

      timelineRef.current = exitTimeline;
    });
  }, [scopeRef]);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || typeof document === "undefined") return undefined;

    const handleActiveScreenExit = (event) => {
      const promise = playExit();
      event.detail?.register?.(promise);
    };

    document.addEventListener(ACTIVE_SCREEN_EXIT_EVENT, handleActiveScreenExit);

    return () => {
      document.removeEventListener(
        ACTIVE_SCREEN_EXIT_EVENT,
        handleActiveScreenExit,
      );
    };
  });

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return undefined;

    const initialDelay = options.delay ?? 0;
    const {
      creamGroups,
      creamItems,
      creamMaskRows,
      creamRows,
      titleGroups,
      titleLetters,
      waterBackgrounds,
      waterContentGroups,
      waterContentItems,
      waterContentMaskRows,
      waterContentRows,
    } = getRevealParts(scope);

    const clearReveal = () => {
      cancelIntroWaitRef.current?.();
      cancelIntroWaitRef.current = null;
      cancelDelayRef.current?.();
      cancelDelayRef.current = null;
      timelineRef.current?.kill();
      timelineRef.current = null;

      gsap.set(
        [
          ...titleGroups,
          ...titleLetters,
          ...waterBackgrounds,
          ...creamGroups,
          ...creamMaskRows,
          ...creamRows,
          ...creamItems,
          ...waterContentGroups,
          ...waterContentMaskRows,
          ...waterContentRows,
          ...waterContentItems,
        ],
        {
          clearProps:
            "clipPath,opacity,visibility,overflow,transform,willChange",
        },
      );

      restoreParagraphLineReveals(scope);
    };

    const prepareReveal = () => {
      const shouldRevealWaterBg =
        !hasPlayedInitialRevealRef.current && !hasRevealedWaterBackground();
      shouldRevealWaterBgRef.current = shouldRevealWaterBg;
      if (shouldRevealWaterBg) {
        markWaterBackgroundRevealed();
      }

      gsap.set(scope, { autoAlpha: 1 });
      gsap.set(titleGroups, { autoAlpha: 1, overflow: "hidden" });
      gsap.set(titleLetters, {
        autoAlpha: 1,
        yPercent: -115,
        willChange: "transform",
      });
      gsap.set(waterBackgrounds, {
        clipPath: shouldRevealWaterBg ? "inset(0 100% 0 0)" : "inset(0 0% 0 0)",
        willChange: shouldRevealWaterBg ? "clip-path" : "auto",
      });
      gsap.set(creamGroups, { autoAlpha: 1 });
      gsap.set(creamRows, {
        autoAlpha: 1,
      });
      gsap.set(creamMaskRows, {
        autoAlpha: 1,
        overflow: "hidden",
      });
      gsap.set(creamItems, {
        autoAlpha: 0,
        y: (index, item) => getRevealY(getRevealOwner(item)),
        willChange: "transform,opacity",
      });
      gsap.set(waterContentGroups, { autoAlpha: 1 });
      gsap.set(waterContentRows, {
        autoAlpha: 1,
      });
      gsap.set(waterContentMaskRows, {
        autoAlpha: 1,
        overflow: "hidden",
      });
      gsap.set(waterContentItems, {
        autoAlpha: 0,
        y: -24,
        willChange: "transform,opacity",
      });
    };

    const playReveal = () => {
      if (prefersReducedMotion()) {
        hasPlayedInitialRevealRef.current = true;
        gsap.set(
          [
            ...titleGroups,
            ...titleLetters,
            ...waterBackgrounds,
            ...creamGroups,
            ...creamMaskRows,
            ...creamRows,
            ...creamItems,
            ...waterContentGroups,
            ...waterContentMaskRows,
            ...waterContentRows,
            ...waterContentItems,
          ],
          {
            autoAlpha: 1,
            clearProps:
              "clipPath,opacity,visibility,overflow,transform,willChange",
          },
        );
        restoreParagraphLineReveals(scope);
        return;
      }

      const start = () => {
        const shouldRevealWaterBg = shouldRevealWaterBgRef.current;
        const sectionWordItems = waterContentItems.filter(isSectionWordRevealItem);
        const regularWaterContentItems = waterContentItems.filter(
          (item) => !isSectionWordRevealItem(item),
        );

        timelineRef.current = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            hasPlayedInitialRevealRef.current = true;
            markWaterBackgroundRevealed();
            gsap.set(sectionWordItems, {
              clearProps: "opacity,visibility,willChange",
              y: 0,
            });
            gsap.set(
              [
                ...titleGroups,
                ...titleLetters,
                ...waterBackgrounds,
                ...creamGroups,
                ...creamMaskRows,
                ...creamRows,
                ...creamItems,
                ...waterContentGroups,
                ...waterContentMaskRows,
                ...waterContentRows,
                ...regularWaterContentItems,
              ],
              {
                clearProps:
                  "clipPath,opacity,visibility,overflow,transform,willChange",
              },
            );
            restoreParagraphLineReveals(scope);
          },
        });

        const timeline = timelineRef.current;

        timeline.add("titleIn", 0);
        timeline.to(
          titleLetters,
          {
            duration: 0.74,
            ease: "expo.out",
            yPercent: 0,
          },
          "titleIn",
        );

        if (shouldRevealWaterBg) {
          timeline.add("waterBgIn", "titleIn+=0.16");
          timeline.to(
            waterBackgrounds,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.82,
              ease: "power3.inOut",
            },
            "waterBgIn",
          );
        } else {
          timeline.add("waterBgIn", "titleIn+=0.16");
          timeline.set(waterBackgrounds, { clipPath: "inset(0 0% 0 0)" }, "waterBgIn");
        }

        timeline.add("creamIn", ">-0.04");
        revealRows(timeline, creamRows, "creamIn", {
          delayForRow: getCreamRowDelay,
          duration: 0.62,
          ease: "power4.out",
        });

        timeline.add("waterContentIn", "creamIn+=0.58");
        revealRows(timeline, waterContentRows, "waterContentIn", {
          duration: 0.68,
          ease: "expo.out",
          rowStagger: 0.085,
        });
      };

      cancelDelayRef.current = () => {};
      const delayId = window.setTimeout(start, initialDelay);
      cancelDelayRef.current = () => window.clearTimeout(delayId);
    };

    prepareReveal();
    cancelIntroWaitRef.current = waitForIntro(playReveal);

    return () => {
      clearReveal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return playExit;
}

export function playActiveScreenExit() {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const exitPromises = [];
  const exitEvent = new CustomEvent(ACTIVE_SCREEN_EXIT_EVENT, {
    detail: {
      register: (promise) => {
        exitPromises.push(Promise.resolve(promise));
      },
    },
  });

  document.dispatchEvent(exitEvent);

  if (!exitPromises.length) {
    return Promise.resolve();
  }

  return Promise.all(exitPromises).then(() => undefined);
}
