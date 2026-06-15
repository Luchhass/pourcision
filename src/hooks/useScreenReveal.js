"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const TITLE_SELECTOR = '[data-screen-reveal="title"]';
const TITLE_FILL_SELECTOR =
  "[data-home-title-fill], [data-setup-title-fill], [data-room-title-fill], [data-results-title-fill]";
const WATER_BG_SELECTOR = '[data-screen-reveal="water-bg"]';
const CREAM_SELECTOR = '[data-screen-reveal="cream"]';
const WATER_CONTENT_SELECTOR = '[data-screen-reveal="water-content"]';
const UTILITY_RAIL_SELECTOR = '[data-utility-placement="rail"]';
const UTILITY_CONTENT_SELECTOR =
  '[data-utility-placement="rail"] .pc-choice-text, [data-utility-placement="rail"] .pc-icon';
const HOME_STATS_SELECTOR = "[data-home-stats]";
const REVEAL_ROW_SELECTOR = "[data-screen-reveal-row]";
const REVEAL_LINE_ROW_SELECTOR = "[data-screen-reveal-line-row]";
const INTRO_COMPLETE_EVENT = "pourcision-page-intro-complete";
const ACTIVE_SCREEN_EXIT_EVENT = "pourcision-active-screen-exit";
const INTRO_SETTLE_DELAY = 120;
const INTRO_TIMEOUT = 6200;
const INTRO_APPEAR_WAIT = 240;
const WATER_BG_REVEALED_KEY = "__pourcisionWaterBgRevealedOnce";
const STABLE_REVEAL_TRANSFORM = { force3D: false };
const STABLE_REVEAL_CLEAR_PROPS =
  "clipPath,opacity,visibility,overflow,willChange";
const REVEAL_ATOMIC_TAGS = new Set([
  "A",
  "BUTTON",
  "CANVAS",
  "INPUT",
  "LABEL",
  "OPTION",
  "P",
  "SELECT",
  "SVG",
  "TEXTAREA",
]);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function markWaterBackgroundRevealed() {
  window[WATER_BG_REVEALED_KEY] = true;
}

function isPageIntroActiveOrPending() {
  if (typeof document === "undefined") return false;
  if (window.__pourcisionPageIntroDoneForPath) return false;

  return (
    Boolean(document.querySelector("[data-page-intro-overlay]")) ||
    document.documentElement.dataset.pageIntroPending === "true"
  );
}

function waitForIntro(callback) {
  if (window.__pourcisionPageIntroDoneForPath) {
    const settleId = window.setTimeout(
      () => callback({ waitedForPageIntro: false }),
      90,
    );
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

  function finish(delay = 0, waitedForPageIntro = false) {
    if (completed) return;

    completed = true;
    cleanup();
    settleId = window.setTimeout(
      () => callback({ waitedForPageIntro }),
      delay,
    );
  }

  function handleComplete() {
    finish(INTRO_SETTLE_DELAY, true);
  }

  const armFallback = (waitedForPageIntro = true) => {
    if (fallbackId) window.clearTimeout(fallbackId);
    fallbackId = window.setTimeout(
      () => finish(INTRO_SETTLE_DELAY, waitedForPageIntro),
      INTRO_TIMEOUT,
    );
  };

  window.addEventListener(INTRO_COMPLETE_EVENT, handleComplete, { once: true });

  if (overlay || introPending) {
    armFallback(true);
  } else {
    let sawOverlay = false;

    observer = new MutationObserver(() => {
      if (sawOverlay) return;

      const nextOverlay = document.querySelector("[data-page-intro-overlay]");
      if (!nextOverlay) return;

      sawOverlay = true;
      armFallback(true);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    fallbackId = window.setTimeout(() => {
      if (!sawOverlay) finish(70, false);
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

function hasGsapTargets(targets) {
  return Array.isArray(targets) ? targets.length > 0 : Boolean(targets);
}

function safeSet(targets, vars, position) {
  if (!hasGsapTargets(targets)) return undefined;

  return gsap.set(targets, vars, position);
}

function safeTimelineSet(timeline, targets, vars, position) {
  if (!hasGsapTargets(targets)) return timeline;

  return timeline.set(targets, vars, position);
}

function safeTimelineTo(timeline, targets, vars, position) {
  if (!hasGsapTargets(targets)) return timeline;

  return timeline.to(targets, vars, position);
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
      (row) => row instanceof HTMLElement && row.getClientRects().length > 0,
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
  if (row.dataset.screenRevealTarget === "self") return [row];
  if (row.dataset.screenRevealTarget === "children") {
    return getSplitRevealChildren(row);
  }

  return row.dataset.screenRevealGroup === "stats"
    ? [row]
    : getSplitRevealChildren(row);
}

function getRevealOwner(item) {
  return item.dataset.screenRevealRow ? item : item.parentElement;
}

function isAtomicRevealElement(element) {
  if (!(element instanceof HTMLElement)) return true;
  if (element.dataset.screenRevealAtomic === "true") return true;
  if (REVEAL_ATOMIC_TAGS.has(element.tagName)) return true;
  if (element.matches("[data-water-color-slider]")) return true;

  const className =
    typeof element.className === "string" ? element.className : "";

  return /\boverflow-x-auto\b/.test(className);
}

function isLayoutRevealWrapper(element) {
  if (isAtomicRevealElement(element)) return false;
  if (element.dataset.screenRevealTarget === "self") return false;

  const children = getRevealChildren(element);
  if (!children.length || children[0] === element) return false;

  if (element.dataset.screenRevealSplit === "children") return true;

  const className =
    typeof element.className === "string" ? element.className : "";

  return /\b(grid|flex|space-y-|gap-|contents)\b/.test(className);
}

function getSplitRevealChildren(element) {
  const children = getRevealChildren(element);

  if (
    children.length === 1 &&
    children[0] !== element &&
    isLayoutRevealWrapper(children[0])
  ) {
    return getSplitRevealChildren(children[0]);
  }

  return children.flatMap((child) =>
    isLayoutRevealWrapper(child) ? getSplitRevealChildren(child) : [child],
  );
}

function getRevealDirection(element, fallback = "down") {
  if (element.dataset.screenRevealDirection === "up") return "up";
  if (element.dataset.screenRevealDirection === "down") return "down";

  const owner = element.closest("[data-screen-reveal-direction]");
  if (owner?.dataset.screenRevealDirection === "up") return "up";
  if (owner?.dataset.screenRevealDirection === "down") return "down";

  return fallback;
}

function hasShadowedRevealSurface() {
  return false;
}

function shouldMask(element) {
  if (element.dataset.screenRevealMask === "none") return false;

  return !hasShadowedRevealSurface(element);
}

function getMaskRows(rows) {
  return rows.filter((row) => shouldMask(row));
}

function isSectionWordRevealItem(item) {
  return !!item.closest("[data-screen-reveal-section-word]");
}

function getRevealY(element, fallback = "down") {
  return getRevealDirection(element, fallback) === "up" ? 104 : -104;
}

function shouldTranslateRevealItem(item) {
  const owner = getRevealOwner(item);

  return owner !== item;
}

function getRevealClipPath(element, fallback = "down") {
  return getRevealDirection(element, fallback) === "up"
    ? "inset(100% 0% 0% 0%)"
    : "inset(0% 0% 100% 0%)";
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

    const position = `${startAt}+=${delay}`;

    safeTimelineSet(timeline, items, { autoAlpha: 1 }, position);
    safeTimelineTo(
      timeline,
      items,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        clearProps: isSectionWord
          ? "opacity,visibility,willChange"
          : "opacity,visibility",
        duration: isStats ? 0.74 : options.duration ?? 0.62,
        ease: isStats ? "expo.out" : options.ease ?? "power4.out",
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: 0,
        stagger:
          items.length > 1 && !isStats ? options.itemStagger ?? 0.026 : 0,
      },
      position,
    );
  });
}

function getRevealParts(scope) {
  prepareParagraphLineReveals(scope);

  const titleGroups = toArray(TITLE_SELECTOR, scope);
  const titleFills = toArray(TITLE_FILL_SELECTOR, scope);
  const waterBackgrounds = toArray(WATER_BG_SELECTOR, scope);
  const utilityRails = toArray(UTILITY_RAIL_SELECTOR, scope);
  const utilityContentItems = toArray(UTILITY_CONTENT_SELECTOR, scope);
  const creamGroups = toArray(CREAM_SELECTOR, scope);
  const homeStatsGroups = toArray(HOME_STATS_SELECTOR, scope);
  const waterContentGroups = toArray(WATER_CONTENT_SELECTOR, scope);
  const titleLetters = titleGroups.flatMap((group) =>
    Array.from(group.querySelectorAll("h1")),
  );
  const creamRows = getRevealRows(creamGroups).filter(
    (row) => !row.closest(HOME_STATS_SELECTOR),
  );
  const creamMaskRows = getMaskRows(creamRows);
  const creamItems = getRevealItems(creamRows);
  const homeStatsRows = getRevealRows(homeStatsGroups);
  const homeStatsMaskRows = getMaskRows(homeStatsRows);
  const homeStatsItems = getRevealItems(homeStatsRows);
  const waterContentRows = getRevealRows(waterContentGroups);
  const waterContentMaskRows = getMaskRows(waterContentRows);
  const waterContentItems = getRevealItems(waterContentRows);

  return {
    creamGroups,
    creamItems,
    creamMaskRows,
    creamRows,
    homeStatsGroups,
    homeStatsItems,
    homeStatsMaskRows,
    homeStatsRows,
    titleFills,
    titleGroups,
    titleLetters,
    utilityContentItems,
    utilityRails,
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
  const forcedWaterRevealKeysRef = useRef(new Set());
  const hasPlayedInitialRevealRef = useRef(false);
  const shouldRevealWaterBgRef = useRef(false);

  const playExit = useCallback(() => {
    const scope = scopeRef.current;

    if (!scope || prefersReducedMotion()) {
      return Promise.resolve();
    }

    const {
      creamItems,
      homeStatsItems,
      titleFills,
      titleLetters,
      utilityContentItems,
      utilityRails,
      waterBackgrounds,
      waterContentItems,
    } = getRevealParts(scope);
    const fadeTargets = [
      ...titleLetters,
      ...utilityContentItems,
      ...creamItems,
      ...homeStatsItems,
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

      safeTimelineSet(
        exitTimeline,
        [...titleFills, ...waterBackgrounds, ...utilityRails],
        {
          autoAlpha: 1,
          willChange: "clip-path, transform",
        },
        0,
      );
      safeTimelineSet(
        exitTimeline,
        [...titleFills, ...waterBackgrounds],
        {
          clipPath: "inset(0 0% 0 0)",
        },
        0,
      );

      safeTimelineTo(
        exitTimeline,
        fadeTargets,
        {
          autoAlpha: 0,
          duration: 0.24,
          ease: "power2.out",
        },
        0,
      );

      exitTimeline.add("layoutPause", ">+=0.3");
      safeTimelineTo(
        exitTimeline,
        titleFills,
        {
          clipPath: "inset(0 0% 0 100%)",
          duration: 0.54,
          ease: "power3.inOut",
        },
        "layoutPause",
      );
      safeTimelineTo(
        exitTimeline,
        waterBackgrounds,
        {
          clipPath: "inset(0 0% 0 100%)",
          duration: 0.56,
          ease: "power3.inOut",
        },
        "layoutPause+=0.14",
      );
      safeTimelineTo(
        exitTimeline,
        utilityRails,
        {
          ...STABLE_REVEAL_TRANSFORM,
          duration: 0.46,
          ease: "expo.inOut",
          xPercent: 115,
        },
        "layoutPause+=0.28",
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
      homeStatsGroups,
      homeStatsItems,
      homeStatsMaskRows,
      homeStatsRows,
      titleFills,
      titleGroups,
      titleLetters,
      utilityContentItems,
      utilityRails,
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

      safeSet(
        [
          ...titleGroups,
          ...titleFills,
          ...titleLetters,
          ...utilityRails,
          ...utilityContentItems,
          ...waterBackgrounds,
          ...creamGroups,
          ...creamMaskRows,
          ...creamRows,
          ...creamItems,
          ...homeStatsGroups,
          ...homeStatsMaskRows,
          ...homeStatsRows,
          ...homeStatsItems,
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
      const forceWaterRevealKey = options.waterRevealKey;
      const shouldForceWaterBg =
        Boolean(forceWaterRevealKey) &&
        !forcedWaterRevealKeysRef.current.has(forceWaterRevealKey);
      const introActiveAtPrepare = isPageIntroActiveOrPending();
      const shouldAnimateLayoutBgs = true;
      shouldRevealWaterBgRef.current = shouldAnimateLayoutBgs;
      if (shouldForceWaterBg) {
        forcedWaterRevealKeysRef.current.add(forceWaterRevealKey);
      }
      if (shouldAnimateLayoutBgs) {
        markWaterBackgroundRevealed();
      }

      safeSet(scope, { autoAlpha: 1 });
      safeSet(titleFills, {
        clipPath: introActiveAtPrepare
          ? "inset(0 0% 0 0)"
          : "inset(0 100% 0 0)",
        willChange: introActiveAtPrepare ? "auto" : "clip-path",
      });
      safeSet(titleGroups, { autoAlpha: 1, overflow: "hidden" });
      safeSet(titleLetters, {
        autoAlpha: 1,
        ...STABLE_REVEAL_TRANSFORM,
        yPercent: -115,
      });
      safeSet(waterBackgrounds, {
        clipPath: shouldAnimateLayoutBgs
          ? "inset(0 100% 0 0)"
          : "inset(0 0% 0 0)",
        willChange: shouldAnimateLayoutBgs ? "clip-path" : "auto",
      });
      safeSet(utilityRails, {
        autoAlpha: 1,
        ...STABLE_REVEAL_TRANSFORM,
        xPercent: shouldAnimateLayoutBgs ? 115 : 0,
        willChange: shouldAnimateLayoutBgs ? "transform" : "auto",
      });
      safeSet(utilityContentItems, {
        autoAlpha: shouldAnimateLayoutBgs ? 0 : 1,
        clipPath: shouldAnimateLayoutBgs
          ? "inset(0% 0% 100% 0%)"
          : "inset(0% 0% 0% 0%)",
        ...STABLE_REVEAL_TRANSFORM,
        yPercent: shouldAnimateLayoutBgs ? -90 : 0,
        willChange: shouldAnimateLayoutBgs
          ? "clip-path, transform, opacity"
          : "auto",
      });
      safeSet(creamGroups, { autoAlpha: 1 });
      safeSet(creamRows, {
        autoAlpha: 1,
      });
      safeSet(creamMaskRows, {
        autoAlpha: 1,
        overflow: "hidden",
      });
      safeSet(creamItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getRevealClipPath(getRevealOwner(item)),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item) ? getRevealY(getRevealOwner(item)) : 0,
        willChange: "clip-path, transform",
      });
      safeSet(homeStatsGroups, { autoAlpha: 1 });
      safeSet(homeStatsRows, {
        autoAlpha: 1,
      });
      safeSet(homeStatsMaskRows, {
        autoAlpha: 1,
        overflow: "hidden",
      });
      safeSet(homeStatsItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getRevealClipPath(getRevealOwner(item)),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item) ? getRevealY(getRevealOwner(item)) : 0,
        willChange: "clip-path, transform",
      });
      safeSet(waterContentGroups, { autoAlpha: 1 });
      safeSet(waterContentRows, {
        autoAlpha: 1,
      });
      safeSet(waterContentMaskRows, {
        autoAlpha: 1,
        overflow: "hidden",
      });
      safeSet(waterContentItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getRevealClipPath(getRevealOwner(item)),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item) ? -104 : 0,
        willChange: "clip-path, transform",
      });
    };

    const playReveal = (introMeta = {}) => {
      const waitedForPageIntro = Boolean(introMeta.waitedForPageIntro);

      if (prefersReducedMotion()) {
        hasPlayedInitialRevealRef.current = true;
        safeSet(
          [
            ...titleGroups,
            ...titleFills,
            ...titleLetters,
            ...utilityRails,
            ...utilityContentItems,
            ...waterBackgrounds,
            ...creamGroups,
            ...creamMaskRows,
            ...creamRows,
            ...creamItems,
            ...homeStatsGroups,
            ...homeStatsMaskRows,
            ...homeStatsRows,
            ...homeStatsItems,
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
        const shouldAnimateLayoutBgs = shouldRevealWaterBgRef.current;
        const shouldAnimateTitleBg =
          shouldAnimateLayoutBgs && !waitedForPageIntro;
        const sectionWordItems = waterContentItems.filter(isSectionWordRevealItem);
        const regularWaterContentItems = waterContentItems.filter(
          (item) => !isSectionWordRevealItem(item),
        );

        timelineRef.current = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            hasPlayedInitialRevealRef.current = true;
            markWaterBackgroundRevealed();
            safeSet(sectionWordItems, {
              clearProps: "opacity,visibility,willChange",
              y: 0,
            });
            safeSet(
              [
                ...titleGroups,
                ...titleFills,
                ...titleLetters,
                ...utilityRails,
                ...utilityContentItems,
                ...waterBackgrounds,
                ...creamGroups,
                ...creamMaskRows,
                ...creamRows,
                ...creamItems,
                ...homeStatsGroups,
                ...homeStatsMaskRows,
                ...homeStatsRows,
                ...homeStatsItems,
                ...waterContentGroups,
                ...waterContentMaskRows,
                ...waterContentRows,
                ...regularWaterContentItems,
              ],
              {
                clearProps: STABLE_REVEAL_CLEAR_PROPS,
              },
            );
            restoreParagraphLineReveals(scope);
          },
        });

        const timeline = timelineRef.current;

        let titleStart = 0;

        if (shouldAnimateLayoutBgs) {
          let bgStart = "titleBgIn";

          if (shouldAnimateTitleBg) {
            timeline.add("titleBgIn", 0);
            safeTimelineTo(
              timeline,
              titleFills,
              {
                clipPath: "inset(0 0% 0 0)",
                duration: 0.54,
                ease: "power3.inOut",
              },
              "titleBgIn",
            );
          } else {
            timeline.add("titleBgIn", 0);
            safeTimelineSet(
              timeline,
              titleFills,
              { clipPath: "inset(0 0% 0 0)" },
              0,
            );
            bgStart = 0;
          }

          timeline.add(
            "waterBgIn",
            shouldAnimateTitleBg ? `${bgStart}+=0.14` : bgStart,
          );
          safeTimelineTo(
            timeline,
            waterBackgrounds,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.56,
              ease: "power3.inOut",
            },
            "waterBgIn",
          );

          timeline.add(
            "utilityRailIn",
            shouldAnimateTitleBg ? `${bgStart}+=0.28` : "waterBgIn+=0.14",
          );
          safeTimelineTo(
            timeline,
            utilityRails,
            {
              duration: 0.46,
              ease: "expo.inOut",
              ...STABLE_REVEAL_TRANSFORM,
              xPercent: 0,
            },
            "utilityRailIn",
          );
          titleStart = "utilityRailIn+=0.46";
        } else {
          safeTimelineSet(
            timeline,
            [...titleFills, ...waterBackgrounds],
            { clipPath: "inset(0 0% 0 0)" },
            0,
          );
          safeTimelineSet(
            timeline,
            utilityRails,
            {
              ...STABLE_REVEAL_TRANSFORM,
              xPercent: 0,
            },
            0,
          );
          titleStart = 0.16;
        }

        timeline.add("titleIn", titleStart);
        safeTimelineTo(
          timeline,
          titleLetters,
          {
            duration: 0.74,
            ease: "expo.out",
            ...STABLE_REVEAL_TRANSFORM,
            yPercent: 0,
          },
          "titleIn",
        );

        timeline.add("creamIn", "titleIn+=0.24");
        revealRows(timeline, creamRows, "creamIn", {
          delayForRow: getCreamRowDelay,
          duration: 0.58,
          ease: "power4.out",
        });

        timeline.add("statsIn", "creamIn+=0.24");
        revealRows(timeline, homeStatsRows, "statsIn", {
          delayForRow: getCreamRowDelay,
          duration: 0.66,
          ease: "expo.out",
        });

        timeline.add("waterContentIn", "statsIn+=0.28");
        revealRows(timeline, waterContentRows, "waterContentIn", {
          duration: 0.62,
          ease: "expo.out",
          rowStagger: 0.065,
        });

        timeline.add("utilityContentIn", "waterContentIn+=0.18");
        safeTimelineTo(
          timeline,
          utilityContentItems,
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.52,
            ease: "power4.out",
            ...STABLE_REVEAL_TRANSFORM,
            yPercent: 0,
            stagger: 0.055,
          },
          "utilityContentIn",
        );
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
