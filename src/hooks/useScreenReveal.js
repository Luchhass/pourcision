"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const TITLE_SELECTOR = '[data-screen-reveal="title"]';
const WATER_BG_SELECTOR = '[data-screen-reveal="water-bg"]';
const CREAM_SELECTOR = '[data-screen-reveal="cream"]';
const WATER_CONTENT_SELECTOR = '[data-screen-reveal="water-content"]';
const REVEAL_ROW_SELECTOR = "[data-screen-reveal-row]";
const INTRO_COMPLETE_EVENT = "pourcision-page-intro-complete";
const ACTIVE_SCREEN_EXIT_EVENT = "pourcision-active-screen-exit";
const INTRO_SETTLE_DELAY = 120;
const INTRO_TIMEOUT = 6200;
const INTRO_APPEAR_WAIT = 240;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

function getRevealRows(groups) {
  return groups.flatMap((group) => {
    const rows = Array.from(group.querySelectorAll(REVEAL_ROW_SELECTOR)).filter(
      (row) => row instanceof HTMLElement,
    );

    return rows.length ? rows : getRevealChildren(group);
  });
}

function getRevealItems(rows) {
  return rows.flatMap((row) => getRevealTargets(row));
}

function getRevealTargets(row) {
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
    const delay =
      options.delayForRow?.(row, index, { groupIndex, groupName }) ??
      index * (options.rowStagger ?? 0.05);

    groupIndexes[groupName] = groupIndex + 1;

    timeline.to(
      items,
      {
        autoAlpha: 1,
        clearProps: "opacity,visibility",
        duration: isStats ? 0.74 : options.duration ?? 0.62,
        ease: isStats ? "expo.out" : options.ease ?? "power4.out",
        y: 0,
      },
      `${startAt}+=${delay}`,
    );
  });
}

function getRevealParts(scope) {
  const titleGroups = toArray(TITLE_SELECTOR, scope);
  const waterBackgrounds = toArray(WATER_BG_SELECTOR, scope);
  const creamGroups = toArray(CREAM_SELECTOR, scope);
  const waterContentGroups = toArray(WATER_CONTENT_SELECTOR, scope);
  const titleLetters = titleGroups.flatMap((group) =>
    Array.from(group.querySelectorAll("h1")),
  );
  const creamRows = getRevealRows(creamGroups);
  const creamItems = getRevealItems(creamRows);
  const waterContentRows = getRevealRows(waterContentGroups);
  const waterContentItems = getRevealItems(waterContentRows);

  return {
    creamGroups,
    creamItems,
    creamRows,
    titleGroups,
    titleLetters,
    waterBackgrounds,
    waterContentGroups,
    waterContentItems,
    waterContentRows,
  };
}

export function useScreenReveal(scopeRef, dependencies = [], options = {}) {
  const timelineRef = useRef(null);
  const cancelIntroWaitRef = useRef(null);
  const cancelDelayRef = useRef(null);

  const playExit = useCallback(() => {
    const scope = scopeRef.current;

    if (!scope || prefersReducedMotion()) {
      return Promise.resolve();
    }

    const {
      creamItems,
      titleLetters,
      waterBackgrounds,
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

      exitTimeline.set(
        waterBackgrounds,
        {
          clipPath: "inset(0 0% 0 0)",
          willChange: "clip-path",
        },
        0,
      );

      exitTimeline.to(
        waterBackgrounds,
        {
          clipPath: "inset(0 0 0 100%)",
          duration: 0.58,
          ease: "power3.inOut",
        },
        0.18,
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
      creamRows,
      titleGroups,
      titleLetters,
      waterBackgrounds,
      waterContentGroups,
      waterContentItems,
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
          ...creamRows,
          ...creamItems,
          ...waterContentGroups,
          ...waterContentRows,
          ...waterContentItems,
        ],
        {
          clearProps:
            "clipPath,opacity,visibility,overflow,transform,willChange",
        },
      );
    };

    const prepareReveal = () => {
      gsap.set(scope, { autoAlpha: 1 });
      gsap.set(titleGroups, { autoAlpha: 1, overflow: "hidden" });
      gsap.set(titleLetters, {
        autoAlpha: 1,
        yPercent: -115,
        willChange: "transform",
      });
      gsap.set(waterBackgrounds, {
        clipPath: "inset(0 100% 0 0)",
        willChange: "clip-path",
      });
      gsap.set(creamGroups, { autoAlpha: 1 });
      gsap.set(creamRows, {
        autoAlpha: 1,
        overflow: (index, row) => (shouldMask(row) ? "hidden" : "visible"),
      });
      gsap.set(creamItems, {
        autoAlpha: 0,
        y: (index, item) => getRevealY(getRevealOwner(item)),
        willChange: "transform,opacity",
      });
      gsap.set(waterContentGroups, { autoAlpha: 1 });
      gsap.set(waterContentRows, {
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
        gsap.set(
          [
            ...titleGroups,
            ...titleLetters,
            ...waterBackgrounds,
            ...creamGroups,
            ...creamRows,
            ...creamItems,
            ...waterContentGroups,
            ...waterContentRows,
            ...waterContentItems,
          ],
          {
            autoAlpha: 1,
            clearProps:
              "clipPath,opacity,visibility,overflow,transform,willChange",
          },
        );
        return;
      }

      const start = () => {
        timelineRef.current = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            gsap.set(
              [
                ...titleGroups,
                ...titleLetters,
                ...waterBackgrounds,
                ...creamGroups,
                ...creamRows,
                ...creamItems,
                ...waterContentGroups,
                ...waterContentRows,
                ...waterContentItems,
              ],
              {
                clearProps:
                  "clipPath,opacity,visibility,overflow,transform,willChange",
              },
            );
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
