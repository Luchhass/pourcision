"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  releaseRevealRowMasks,
  setRevealRowMasks,
} from "@/lib/revealMasks";

const TITLE_SELECTOR = '[data-screen-reveal="title"]';
const TITLE_FILL_SELECTOR =
  "[data-home-title-fill], [data-setup-title-fill], [data-room-title-fill], [data-results-title-fill]";
const WATER_BG_SELECTOR = '[data-screen-reveal="water-bg"]';
const CREAM_SELECTOR = '[data-screen-reveal="cream"]';
const WATER_CONTENT_SELECTOR = '[data-screen-reveal="water-content"]';
const UTILITY_RAIL_SELECTOR = '[data-utility-placement="rail"]';
const UTILITY_CONTENT_SELECTOR =
  '[data-utility-placement="rail"] .pc-choice-text, [data-utility-placement="rail"] .pc-icon, [data-utility-placement="rail"] [data-utility-reveal-item]';
const FIXED_SCREEN_CONTROL_SELECTOR =
  ".pc-title-band > button, [data-results-screen='true'] > button";
const RESULTS_SCREEN_SELECTOR = '[data-results-screen="true"]';
const HOME_STATS_SELECTOR = "[data-home-stats]";
const REVEAL_ROW_SELECTOR = "[data-screen-reveal-row]";
const REVEAL_LINE_ROW_SELECTOR = "[data-screen-reveal-line-row]";
const INTRO_COMPLETE_EVENT = "pourcision-page-intro-complete";
const SCREEN_REVEAL_COMPLETE_EVENT = "pourcision-screen-reveal-complete";
const SCREEN_REVEAL_MUSIC_READY_EVENT = "pourcision-screen-reveal-music-ready";
const ACTIVE_SCREEN_EXIT_EVENT = "pourcision-active-screen-exit";
const GAME_START_TRANSITION_OVERLAY_SELECTOR =
  "[data-game-start-transition-overlay]";
const RESULTS_EXIT_TRANSITION_LAYER_SELECTOR =
  "[data-results-exit-transition-layer]";
const INTRO_SETTLE_DELAY = 120;
const INTRO_TIMEOUT = 6200;
const INTRO_APPEAR_WAIT = 240;
const WATER_BG_REVEALED_KEY = "__pourcisionWaterBgRevealedOnce";
const FORCE_FULL_REVEAL_KEY = "__pourcisionForceFullRevealOnce";
const PRESERVE_TITLE_BG_REVEAL_KEY = "__pourcisionPreserveTitleBgRevealOnce";
const STABLE_REVEAL_TRANSFORM = { force3D: false };
const REVEAL_FINAL_CLIP_PATH = "inset(-2rem -2rem -2rem -2rem)";
const TITLE_FILL_FULL_CLIP_PATH = "inset(-0.72em 0% -0.92em 0)";
const TITLE_FILL_REVEAL_START_CLIP_PATH = "inset(-0.72em 100% -0.92em 0)";
const TITLE_FILL_EXIT_LEFT_CLIP_PATH = TITLE_FILL_REVEAL_START_CLIP_PATH;
const WATER_BG_REVEAL_START_CLIP_PATH = "inset(0 100% 0 0)";
const WATER_BG_EXIT_RIGHT_CLIP_PATH = "inset(0 0 0 100%)";
const EXIT_CONTENT_FADE_DURATION = 0.32;
const EXIT_CONTENT_FADE_EASE = "power2.inOut";
const EXIT_RAIL_SLIDE_DURATION = 0.48;
const EXIT_TITLE_BG_SLIDE_DURATION = 0.56;
const EXIT_WATER_BG_SLIDE_DURATION = 0.6;
const EXIT_SCOREBOARD_WATER_BG_SLIDE_DURATION = 0.64;
const EXIT_RESULTS_OVERLAY_DURATION = 0.8;
const EXIT_SCOREBOARD_OVERLAY_DURATION = 0.68;
const GAME_START_DARKEN_DURATION = 0.52;
const GAME_START_OVERLAY_RELEASE_DURATION = 0.34;
const TITLE_REVEAL_START_Y_PERCENT = -285;
const SCREEN_REVEAL_MUSIC_LEAD_SECONDS = 2;
const CONTENT_ONLY_REVEAL_DISTANCE_RATIO = 0.72;
const CONTENT_ONLY_TITLE_REVEAL_START_Y_PERCENT = -285;
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

function hasWaterBackgroundRevealed() {
  return Boolean(window[WATER_BG_REVEALED_KEY]);
}

export function requestNextFullScreenReveal({ preserveTitleBg = false } = {}) {
  if (typeof window === "undefined") return;

  window[FORCE_FULL_REVEAL_KEY] = true;
  if (preserveTitleBg) {
    window[PRESERVE_TITLE_BG_REVEAL_KEY] = true;
  } else {
    delete window[PRESERVE_TITLE_BG_REVEAL_KEY];
  }
  delete window[WATER_BG_REVEALED_KEY];
}

function consumeNextFullScreenRevealRequest() {
  if (typeof window === "undefined" || !window[FORCE_FULL_REVEAL_KEY]) {
    return false;
  }

  delete window[FORCE_FULL_REVEAL_KEY];
  delete window[WATER_BG_REVEALED_KEY];
  return true;
}

function consumePreserveTitleBgRevealRequest() {
  if (
    typeof window === "undefined" ||
    !window[PRESERVE_TITLE_BG_REVEAL_KEY]
  ) {
    return false;
  }

  delete window[PRESERVE_TITLE_BG_REVEAL_KEY];
  return true;
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

function notifyScreenRevealComplete() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(SCREEN_REVEAL_COMPLETE_EVENT));
}

function notifyScreenRevealMusicReady() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(SCREEN_REVEAL_MUSIC_READY_EVENT));
}

function addScreenRevealMusicCue(timeline) {
  if (
    !timeline ||
    typeof timeline.call !== "function" ||
    typeof timeline.duration !== "function"
  ) {
    return;
  }

  timeline.call(
    notifyScreenRevealMusicReady,
    [],
    Math.max(0, timeline.duration() - SCREEN_REVEAL_MUSIC_LEAD_SECONDS),
  );
}

function toArray(selector, scope) {
  return gsap.utils.toArray(selector, scope);
}

function hasGsapTargets(targets) {
  return Array.isArray(targets) ? targets.length > 0 : Boolean(targets);
}

function getLargestTextFontSize(element) {
  if (!(element instanceof HTMLElement)) return 16;

  const candidates = [element, ...Array.from(element.querySelectorAll("*"))]
    .filter(
      (candidate) =>
        candidate instanceof HTMLElement &&
        candidate.getClientRects().length > 0 &&
        (candidate.textContent || "").trim().length > 0,
    );

  return candidates.reduce((largest, candidate) => {
    const fontSize = Number.parseFloat(
      window.getComputedStyle(candidate).fontSize,
    );
    return Number.isFinite(fontSize) ? Math.max(largest, fontSize) : largest;
  }, 16);
}

function getTitleRevealClipPath(titleGroup) {
  const fontSize = getLargestTextFontSize(titleGroup);
  const top = Math.ceil(fontSize * 0.14);
  const bottom = Math.ceil(fontSize * 0.78);
  const side = Math.ceil(fontSize * 0.82);

  return `inset(-${top}px -${side}px -${bottom}px -${side}px)`;
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

  return {
    height,
    left: visualViewport?.offsetLeft || 0,
    top: visualViewport?.offsetTop || 0,
    width,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createFixedTransitionLayer({ backgroundColor, layer }) {
  const element = document.createElement("div");

  element.dataset.resultsExitTransitionLayer = layer;
  element.setAttribute("aria-hidden", "true");
  Object.assign(element.style, {
    backgroundColor,
    inset: "0",
    opacity: "0",
    pointerEvents: "auto",
    position: "fixed",
    zIndex: layer === "overlay" ? "9998" : "9997",
  });

  document.body.appendChild(element);
  return element;
}

function getResultsExitTransitionLayers() {
  if (typeof document === "undefined") {
    return { overlay: null, underlay: null };
  }

  const existingLayers = document.querySelectorAll(
    RESULTS_EXIT_TRANSITION_LAYER_SELECTOR,
  );

  existingLayers.forEach((layer) => layer.remove());

  return {
    overlay: createFixedTransitionLayer({
      backgroundColor: "#020202",
      layer: "overlay",
    }),
    underlay: createFixedTransitionLayer({
      backgroundColor: "#f7f7f2",
      layer: "underlay",
    }),
  };
}

function releaseResultsExitTransitionLayers({
  immediate = false,
  preserveTitlePaint = false,
} = {}) {
  if (typeof document === "undefined") return;

  const layers = Array.from(
    document.querySelectorAll(RESULTS_EXIT_TRANSITION_LAYER_SELECTOR),
  );

  if (!layers.length) return;

  gsap.killTweensOf(layers);

  if (immediate) {
    layers.forEach((layer) => layer.remove());
    return;
  }

  if (preserveTitlePaint) {
    const overlay = layers.find(
      (layer) => layer.dataset.resultsExitTransitionLayer === "overlay",
    );
    const underlays = layers.filter((layer) => layer !== overlay);

    underlays.forEach((layer) => layer.remove());

    if (!overlay) return;

    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "9998";

    window.requestAnimationFrame(() => {
      const viewport = readViewportBox();

      gsap.set(overlay, {
        autoAlpha: 1,
        backgroundColor: "#020202",
        clipPath: "inset(0px 0px 0px 0px)",
        inset: "auto",
        left: viewport.left,
        position: "fixed",
        top: viewport.top,
        width: viewport.width,
        height: viewport.height,
        x: 0,
        y: 0,
      });

      window.requestAnimationFrame(() => {
        gsap.to(overlay, {
          clipPath: getTitleFillClipPath(viewport),
          duration: EXIT_RESULTS_OVERLAY_DURATION,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.to(overlay, {
              autoAlpha: 0,
              duration: 0.08,
              ease: "power2.out",
              onComplete: () => overlay.remove(),
            });
          },
        });
      });
    });
    return;
  }

  gsap.to(layers, {
    autoAlpha: 0,
    duration: 0.18,
    ease: "power2.out",
    onComplete: () => {
      layers.forEach((layer) => layer.remove());
    },
  });
}

function getTitleFillClipPath(viewport) {
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

function setFixedLayerToViewport(timeline, layer, viewport, position) {
  safeTimelineSet(
    timeline,
    layer,
    {
      bottom: "auto",
      height: viewport.height,
      inset: "auto",
      left: viewport.left,
      position: "fixed",
      right: "auto",
      top: viewport.top,
      width: viewport.width,
      x: 0,
      y: 0,
    },
    position,
  );
}

function getGameStartTransitionOverlay() {
  if (typeof document === "undefined") return null;

  const existingOverlay = document.querySelector(
    GAME_START_TRANSITION_OVERLAY_SELECTOR,
  );

  if (existingOverlay) return existingOverlay;

  const overlay = document.createElement("div");

  overlay.dataset.gameStartTransitionOverlay = "true";
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    backgroundColor: "#f7f7f2",
    inset: "0",
    opacity: "0",
    pointerEvents: "auto",
    position: "fixed",
    zIndex: "9998",
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function releaseGameStartTransitionOverlay() {
  if (typeof document === "undefined") return;

  const overlay = document.querySelector(GAME_START_TRANSITION_OVERLAY_SELECTOR);
  if (!overlay) return;

  gsap.killTweensOf(overlay);
  gsap.to(overlay, {
    autoAlpha: 0,
    duration: GAME_START_OVERLAY_RELEASE_DURATION,
    ease: "power2.inOut",
    onComplete: () => overlay.remove(),
  });
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

function shouldMask(element) {
  if (!element) return false;
  if (element.dataset.screenRevealMask === "none") return false;

  return true;
}

function getMaskRows(rows) {
  return rows.filter((row) => shouldMask(row));
}

function getRevealY(element, fallback = "down") {
  return getRevealDirection(element, fallback) === "up" ? 190 : -190;
}

function shouldTranslateRevealItem(item) {
  const owner = getRevealOwner(item);

  return owner !== item;
}

function getRevealClipPath(element, fallback = "down") {
  return getRevealDirection(element, fallback) === "up"
    ? "inset(100% -1% -28% -1%)"
    : "inset(-18% -1% 100% -1%)";
}

function getInitialItemClipPath(item) {
  return shouldTranslateRevealItem(item)
    ? REVEAL_FINAL_CLIP_PATH
    : getRevealClipPath(getRevealOwner(item));
}

function getCreamRowDelay(row, index, meta) {
  if (row.dataset.screenRevealGroup === "stats") {
    return 0.3 + meta.groupIndex * 0.072;
  }

  return index * 0.064;
}

function getContentOnlyRowDelay(row, index, meta) {
  if (row.dataset.screenRevealGroup === "stats") {
    return 0.27 + meta.groupIndex * 0.09;
  }

  return index * 0.086;
}

function getExplicitRevealDelay(row) {
  const delay = Number.parseFloat(row.dataset.screenRevealDelay || "");

  return Number.isFinite(delay) ? delay : null;
}

function revealRows(timeline, rows, startAt, options = {}) {
  const groupIndexes = {};

  rows.forEach((row, index) => {
    const items = getRevealTargets(row);
    const groupName = row.dataset.screenRevealGroup || "default";
    const groupIndex = groupIndexes[groupName] ?? 0;
    const isStats = groupName === "stats";
    const explicitDelay = getExplicitRevealDelay(row);
    const delay =
      explicitDelay ??
      options.delayForRow?.(row, index, { groupIndex, groupName }) ??
      index * (options.rowStagger ?? 0.05);

    groupIndexes[groupName] = groupIndex + 1;

    const position = `${startAt}+=${delay}`;

    safeTimelineSet(timeline, items, { autoAlpha: 1 }, position);
    safeTimelineTo(
      timeline,
      items,
      {
        clipPath: REVEAL_FINAL_CLIP_PATH,
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
  const fixedScreenControls = toArray(FIXED_SCREEN_CONTROL_SELECTOR, scope);
  const resultsScreens = toArray(RESULTS_SCREEN_SELECTOR, scope);
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
    fixedScreenControls,
    homeStatsGroups,
    homeStatsItems,
    homeStatsMaskRows,
    homeStatsRows,
    resultsScreens,
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

function clearPersistentRevealMasks({
  creamItems,
  creamMaskRows,
  homeStatsItems,
  homeStatsMaskRows,
  titleFills,
  titleGroups,
  utilityContentItems,
  waterBackgrounds,
  waterContentItems,
  waterContentMaskRows,
}) {
  safeSet(
    [
      ...titleGroups,
      ...titleFills,
      ...utilityContentItems,
      ...waterBackgrounds,
      ...creamItems,
      ...homeStatsItems,
      ...waterContentItems,
    ],
    { clearProps: "clipPath,willChange" },
  );
  releaseRevealRowMasks(gsap, [
    ...creamMaskRows,
    ...homeStatsMaskRows,
    ...waterContentMaskRows,
  ]);
  safeSet(titleGroups, { overflow: "visible" });
}

export function useScreenReveal(scopeRef, dependencies = [], options = {}) {
  const timelineRef = useRef(null);
  const cancelIntroWaitRef = useRef(null);
  const cancelDelayRef = useRef(null);
  const forcedWaterRevealKeysRef = useRef(new Set());
  const hasPlayedInitialRevealRef = useRef(false);
  const preserveTitleBgRevealRef = useRef(false);
  const shouldRevealWaterBgRef = useRef(false);

  const playExit = useCallback((exitOptions = {}) => {
    const scope = scopeRef.current;

    if (!scope || prefersReducedMotion()) {
      return Promise.resolve();
    }

    const {
      creamItems,
      fixedScreenControls,
      homeStatsItems,
      resultsScreens,
      titleFills,
      titleLetters,
      utilityRails,
      waterBackgrounds,
      waterContentItems,
      utilityContentItems,
    } = getRevealParts(scope);
    const isGameStartExit = exitOptions.variant === "game-start";
    const isResultsExit = exitOptions.variant === "results-exit";
    const isScoreboardExit = exitOptions.variant === "scoreboard-exit";
    const fadeTargets = [
      ...titleLetters,
      ...creamItems,
      ...homeStatsItems,
      ...waterContentItems,
    ];
    const gameStartFadeTargets = [
      ...fadeTargets,
      ...utilityContentItems,
      ...fixedScreenControls,
    ];
    const resultsExitFadeTargets = [
      ...gameStartFadeTargets,
      ...utilityRails,
    ];
    const scoreboardExitFadeTargets = [
      ...fadeTargets,
      ...fixedScreenControls,
    ];

    timelineRef.current?.kill();
    cancelIntroWaitRef.current?.();
    cancelDelayRef.current?.();

    return new Promise((resolve) => {
      const exitTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: resolve,
      });

      if (isGameStartExit) {
        const overlay = getGameStartTransitionOverlay();

        safeTimelineSet(
          exitTimeline,
          overlay,
          {
            autoAlpha: 0,
            backgroundColor: "#f7f7f2",
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          [...titleFills, ...waterBackgrounds, ...utilityRails],
          {
            autoAlpha: 1,
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          titleFills,
          {
            clipPath: TITLE_FILL_FULL_CLIP_PATH,
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          waterBackgrounds,
          {
            clipPath: "inset(0 0% 0 0)",
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          utilityRails,
          {
            ...STABLE_REVEAL_TRANSFORM,
            xPercent: 0,
          },
          0,
        );
        safeTimelineTo(
          exitTimeline,
          gameStartFadeTargets,
          {
            autoAlpha: 0,
            duration: EXIT_CONTENT_FADE_DURATION,
            ease: EXIT_CONTENT_FADE_EASE,
          },
          0,
        );
        safeTimelineTo(
          exitTimeline,
          utilityRails,
          {
            duration: EXIT_RAIL_SLIDE_DURATION,
            ease: "expo.inOut",
            ...STABLE_REVEAL_TRANSFORM,
            xPercent: 115,
          },
          0.1,
        );
        safeTimelineTo(
          exitTimeline,
          waterBackgrounds,
          {
            clipPath: WATER_BG_EXIT_RIGHT_CLIP_PATH,
            duration: EXIT_WATER_BG_SLIDE_DURATION,
            ease: "power3.inOut",
          },
          0.18,
        );
        safeTimelineTo(
          exitTimeline,
          titleFills,
          {
            clipPath: TITLE_FILL_EXIT_LEFT_CLIP_PATH,
            duration: EXIT_TITLE_BG_SLIDE_DURATION,
            ease: "power3.inOut",
          },
          0.22,
        );
        safeTimelineSet(
          exitTimeline,
          overlay,
          {
            autoAlpha: 1,
          },
          0.82,
        );
        safeTimelineTo(
          exitTimeline,
          overlay,
          {
            backgroundColor: "#020202",
            duration: GAME_START_DARKEN_DURATION,
            ease: "power2.inOut",
          },
          0.86,
        );

        timelineRef.current = exitTimeline;
        return;
      }

      if (isResultsExit) {
        const { overlay, underlay } = getResultsExitTransitionLayers();
        const viewport = readViewportBox();

        requestNextFullScreenReveal({ preserveTitleBg: true });

        safeTimelineSet(
          exitTimeline,
          [underlay, overlay],
          {
            autoAlpha: 0,
          },
          0,
        );
        setFixedLayerToViewport(exitTimeline, underlay, viewport, 0);
        setFixedLayerToViewport(exitTimeline, overlay, viewport, 0);
        safeTimelineSet(
          exitTimeline,
          overlay,
          {
            backgroundColor: "#020202",
            borderRadius: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            transformOrigin: "left top",
            willChange: "clip-path,opacity",
            x: 0,
            y: 0,
          },
          0,
        );
        safeTimelineTo(
          exitTimeline,
          resultsExitFadeTargets,
          {
            autoAlpha: 0,
            duration: EXIT_CONTENT_FADE_DURATION,
            ease: EXIT_CONTENT_FADE_EASE,
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          [underlay, overlay],
          {
            autoAlpha: 1,
          },
          0.24,
        );
        safeTimelineSet(
          exitTimeline,
          resultsScreens,
          {
            autoAlpha: 0,
          },
          0.24,
        );

        timelineRef.current = exitTimeline;
        return;
      }

      if (isScoreboardExit) {
        const { overlay, underlay } = getResultsExitTransitionLayers();
        const viewport = readViewportBox();
        const startClipPath = getTitleFillClipPath(viewport);

        safeTimelineSet(
          exitTimeline,
          [underlay, overlay],
          {
            autoAlpha: 0,
          },
          0,
        );
        setFixedLayerToViewport(exitTimeline, underlay, viewport, 0);
        setFixedLayerToViewport(exitTimeline, overlay, viewport, 0);
        safeTimelineSet(
          exitTimeline,
          [...titleFills, ...waterBackgrounds, ...utilityRails],
          {
            autoAlpha: 1,
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          titleFills,
          {
            clipPath: TITLE_FILL_FULL_CLIP_PATH,
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          waterBackgrounds,
          {
            clipPath: "inset(0 0% 0 0)",
          },
          0,
        );
        safeTimelineSet(
          exitTimeline,
          utilityRails,
          {
            ...STABLE_REVEAL_TRANSFORM,
            xPercent: 0,
          },
          0,
        );
        safeTimelineTo(
          exitTimeline,
          scoreboardExitFadeTargets,
          {
            autoAlpha: 0,
            duration: EXIT_CONTENT_FADE_DURATION,
            ease: EXIT_CONTENT_FADE_EASE,
          },
          0,
        );
        safeTimelineTo(
          exitTimeline,
          waterBackgrounds,
          {
            clipPath: WATER_BG_EXIT_RIGHT_CLIP_PATH,
            duration: EXIT_SCOREBOARD_WATER_BG_SLIDE_DURATION,
            ease: "power3.inOut",
          },
          0.14,
        );
        safeTimelineSet(
          exitTimeline,
          overlay,
          {
            autoAlpha: 1,
            backgroundColor: "#020202",
            borderRadius: 0,
            clipPath: startClipPath,
            transformOrigin: "left top",
            willChange: "clip-path,opacity",
            x: 0,
            y: 0,
          },
          0.76,
        );
        safeTimelineTo(
          exitTimeline,
          overlay,
          {
            clipPath: "inset(0px 0px 0px 0px)",
            duration: EXIT_SCOREBOARD_OVERLAY_DURATION,
            ease: "power3.inOut",
          },
          0.78,
        );
        exitTimeline.call(() => {
          window.setTimeout(
            () => releaseResultsExitTransitionLayers(),
            900,
          );
        });

        timelineRef.current = exitTimeline;
        return;
      }

      safeTimelineSet(
        exitTimeline,
        [...titleFills, ...waterBackgrounds, ...utilityRails],
        {
          autoAlpha: 1,
        },
        0,
      );
      safeTimelineSet(
        exitTimeline,
        titleFills,
        {
          clipPath: TITLE_FILL_FULL_CLIP_PATH,
        },
        0,
      );
      safeTimelineSet(
        exitTimeline,
        waterBackgrounds,
        {
          clipPath: "inset(0 0% 0 0)",
        },
        0,
      );
      safeTimelineSet(
        exitTimeline,
        utilityRails,
        {
          ...STABLE_REVEAL_TRANSFORM,
          xPercent: 0,
        },
        0,
      );

      safeTimelineTo(
        exitTimeline,
        fadeTargets,
        {
          autoAlpha: 0,
          duration: EXIT_CONTENT_FADE_DURATION,
          ease: EXIT_CONTENT_FADE_EASE,
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
      const promise = playExit({
        variant: event.detail?.variant,
      });
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
      const clearTitleFills = preserveTitleBgRevealRef.current
        ? []
        : titleFills;

      safeSet(
        [
          ...titleGroups,
          ...clearTitleFills,
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
      const shouldForceFullReveal = consumeNextFullScreenRevealRequest();
      const shouldPreserveTitleBgReveal =
        shouldForceFullReveal && consumePreserveTitleBgRevealRequest();
      const introActiveAtPrepare = isPageIntroActiveOrPending();
      const shouldAnimateLayoutBgs =
        shouldForceFullReveal || shouldForceWaterBg || !hasWaterBackgroundRevealed();
      const revealDistanceRatio = shouldAnimateLayoutBgs
        ? 1
        : CONTENT_ONLY_REVEAL_DISTANCE_RATIO;
      shouldRevealWaterBgRef.current = shouldAnimateLayoutBgs;
      preserveTitleBgRevealRef.current = shouldPreserveTitleBgReveal;
      if (!shouldPreserveTitleBgReveal) {
        releaseResultsExitTransitionLayers();
      }
      if (shouldForceWaterBg) {
        forcedWaterRevealKeysRef.current.add(forceWaterRevealKey);
      }

      safeSet(scope, { autoAlpha: 1 });
      if (shouldPreserveTitleBgReveal) {
        gsap.killTweensOf(titleFills);
      }
      safeSet(titleFills, {
        autoAlpha: 1,
        clipPath:
          shouldAnimateLayoutBgs &&
          !introActiveAtPrepare &&
          !shouldPreserveTitleBgReveal
            ? TITLE_FILL_REVEAL_START_CLIP_PATH
            : TITLE_FILL_FULL_CLIP_PATH,
        willChange:
          shouldAnimateLayoutBgs &&
          !introActiveAtPrepare &&
          !shouldPreserveTitleBgReveal
            ? "clip-path"
            : "auto",
      });
      if (shouldPreserveTitleBgReveal) {
        releaseResultsExitTransitionLayers({ preserveTitlePaint: true });
      }
      safeSet(titleGroups, {
        autoAlpha: 1,
        clipPath: (index, titleGroup) => getTitleRevealClipPath(titleGroup),
        overflow: "visible",
      });
      safeSet(titleLetters, {
        autoAlpha: 1,
        ...STABLE_REVEAL_TRANSFORM,
        yPercent: shouldAnimateLayoutBgs
          ? TITLE_REVEAL_START_Y_PERCENT
          : CONTENT_ONLY_TITLE_REVEAL_START_Y_PERCENT,
      });
      safeSet(waterBackgrounds, {
        clipPath: shouldAnimateLayoutBgs
          ? WATER_BG_REVEAL_START_CLIP_PATH
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
          : REVEAL_FINAL_CLIP_PATH,
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
      safeSet(creamMaskRows, { autoAlpha: 1 });
      setRevealRowMasks(gsap, creamMaskRows);
      safeSet(creamItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getInitialItemClipPath(item),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item)
            ? getRevealY(getRevealOwner(item)) * revealDistanceRatio
            : 0,
        willChange: "clip-path, transform",
      });
      safeSet(homeStatsGroups, { autoAlpha: 1 });
      safeSet(homeStatsRows, {
        autoAlpha: 1,
      });
      safeSet(homeStatsMaskRows, { autoAlpha: 1 });
      setRevealRowMasks(gsap, homeStatsMaskRows);
      safeSet(homeStatsItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getInitialItemClipPath(item),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item)
            ? getRevealY(getRevealOwner(item)) * revealDistanceRatio
            : 0,
        willChange: "clip-path, transform",
      });
      safeSet(waterContentGroups, { autoAlpha: 1 });
      safeSet(waterContentRows, {
        autoAlpha: 1,
      });
      safeSet(waterContentMaskRows, { autoAlpha: 1 });
      setRevealRowMasks(gsap, waterContentMaskRows);
      safeSet(waterContentItems, {
        autoAlpha: 0,
        clipPath: (index, item) => getInitialItemClipPath(item),
        ...STABLE_REVEAL_TRANSFORM,
        y: 0,
        yPercent: (index, item) =>
          shouldTranslateRevealItem(item) ? -104 * revealDistanceRatio : 0,
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
        notifyScreenRevealComplete();
        return;
      }

      const start = () => {
        const shouldAnimateLayoutBgs = shouldRevealWaterBgRef.current;
        const shouldPreserveTitleBgReveal =
          preserveTitleBgRevealRef.current;
        const revealTitleFills = shouldPreserveTitleBgReveal
          ? []
          : titleFills;
        const isContentOnlyReveal = !shouldAnimateLayoutBgs;
        const shouldAnimateTitleBg =
          shouldAnimateLayoutBgs &&
          !waitedForPageIntro &&
          !shouldPreserveTitleBgReveal;
        const rowDelay = isContentOnlyReveal
          ? getContentOnlyRowDelay
          : getCreamRowDelay;

        if (shouldAnimateLayoutBgs) {
          markWaterBackgroundRevealed();
        }

        timelineRef.current = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            hasPlayedInitialRevealRef.current = true;
            markWaterBackgroundRevealed();
            clearPersistentRevealMasks({
              creamItems,
              creamMaskRows,
              homeStatsItems,
              homeStatsMaskRows,
              titleFills: revealTitleFills,
              titleGroups,
              utilityContentItems,
              waterBackgrounds,
              waterContentItems,
              waterContentMaskRows,
            });
            if (shouldPreserveTitleBgReveal) {
              preserveTitleBgRevealRef.current = false;
            }
            notifyScreenRevealComplete();
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
              revealTitleFills,
              {
                clipPath: TITLE_FILL_FULL_CLIP_PATH,
                duration: 0.54,
                ease: "power3.inOut",
              },
              "titleBgIn",
            );
          } else {
            timeline.add("titleBgIn", 0);
            safeTimelineSet(
              timeline,
              revealTitleFills,
              { clipPath: TITLE_FILL_FULL_CLIP_PATH },
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
            revealTitleFills,
            { clipPath: TITLE_FILL_FULL_CLIP_PATH },
            0,
          );
          safeTimelineSet(
            timeline,
            waterBackgrounds,
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
          titleStart = 0.08;
        }

        timeline.add("titleIn", titleStart);
        safeTimelineTo(
          timeline,
          titleLetters,
          {
            duration: isContentOnlyReveal ? 0.98 : 0.86,
            ease: isContentOnlyReveal ? "power3.out" : "expo.out",
            ...STABLE_REVEAL_TRANSFORM,
            yPercent: 0,
          },
          "titleIn",
        );

        timeline.add(
          "creamIn",
          isContentOnlyReveal ? "titleIn+=0.26" : "titleIn+=0.2",
        );
        revealRows(timeline, creamRows, "creamIn", {
          delayForRow: rowDelay,
          duration: isContentOnlyReveal ? 0.92 : 0.62,
          ease: isContentOnlyReveal ? "power3.out" : "power4.out",
          itemStagger: isContentOnlyReveal ? 0.038 : undefined,
          rowStagger: isContentOnlyReveal ? 0.086 : undefined,
        });

        timeline.add(
          "statsIn",
          isContentOnlyReveal ? "creamIn+=0.26" : "creamIn+=0.19",
        );
        revealRows(timeline, homeStatsRows, "statsIn", {
          delayForRow: rowDelay,
          duration: isContentOnlyReveal ? 0.96 : 0.7,
          ease: isContentOnlyReveal ? "power3.out" : "expo.out",
        });

        timeline.add(
          "waterContentIn",
          isContentOnlyReveal ? "statsIn+=0.28" : "statsIn+=0.22",
        );
        revealRows(timeline, waterContentRows, "waterContentIn", {
          duration: isContentOnlyReveal ? 0.98 : 0.66,
          ease: isContentOnlyReveal ? "power3.out" : "expo.out",
          itemStagger: isContentOnlyReveal ? 0.038 : undefined,
          rowStagger: isContentOnlyReveal ? 0.086 : 0.054,
        });

        if (shouldAnimateLayoutBgs) {
          timeline.add("utilityContentIn", "waterContentIn+=0.14");
          safeTimelineTo(
            timeline,
            utilityContentItems,
            {
              autoAlpha: 1,
              clipPath: REVEAL_FINAL_CLIP_PATH,
              duration: 0.56,
              ease: "power4.out",
              ...STABLE_REVEAL_TRANSFORM,
              yPercent: 0,
              stagger: 0.046,
            },
            "utilityContentIn",
          );
        }

        addScreenRevealMusicCue(timeline);
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

function playActiveScreenExitVariant(variant = "default") {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const exitPromises = [];
  const exitEvent = new CustomEvent(ACTIVE_SCREEN_EXIT_EVENT, {
    detail: {
      register: (promise) => {
        exitPromises.push(Promise.resolve(promise));
      },
      variant,
    },
  });

  document.dispatchEvent(exitEvent);

  if (!exitPromises.length) {
    return Promise.resolve();
  }

  return Promise.all(exitPromises).then(() => undefined);
}

export function playActiveScreenExit() {
  return playActiveScreenExitVariant();
}

export function playGameStartScreenExit() {
  return playActiveScreenExitVariant("game-start");
}

export function playScoreboardScreenExit() {
  return playActiveScreenExitVariant("scoreboard-exit");
}
