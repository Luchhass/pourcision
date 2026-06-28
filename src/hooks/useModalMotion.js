"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  releaseRevealRowMasks,
  setRevealRowMasks,
} from "@/lib/revealMasks";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const STABLE_TRANSFORM = { force3D: false };

const DEFAULT_ROW_SELECTOR = "[data-modal-reveal-row]";
const DEFAULT_ITEM_SELECTOR = "[data-modal-reveal-item]";
const MODAL_OVERLAY_IN_DURATION = 0.28;
const MODAL_OVERLAY_OUT_DURATION = 0.26;
const MODAL_PANEL_IN_DURATION = 0.48;
const MODAL_PANEL_OUT_DURATION = 0.28;
const MODAL_ITEM_IN_DURATION = 0.46;
const MODAL_ITEM_OUT_DURATION = 0.18;
const MODAL_ITEM_IN_STAGGER = 0.036;
const MODAL_ITEM_OUT_STAGGER = 0.014;
const MODAL_PANEL_START_BLUR = "blur(8px)";
const MODAL_PANEL_END_BLUR = "blur(0px)";
const MODAL_PANEL_EXIT_BLUR = "blur(5px)";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

function getTargets(panel, rowSelector, itemSelector) {
  if (!panel) {
    return { items: [], rows: [] };
  }

  return {
    items: Array.from(panel.querySelectorAll(itemSelector)),
    rows: Array.from(panel.querySelectorAll(rowSelector)),
  };
}

function releaseRowMasks(rows) {
  releaseRevealRowMasks(gsap, rows);
}

function clearEntranceProps(panel, items) {
  gsap.set(panel, {
    clearProps: "filter,transform,transformOrigin,willChange",
  });
  if (items.length) {
    gsap.set(items, {
      clearProps: "transform,willChange",
    });
  }
}

export function useModalMotion({
  itemSelector = DEFAULT_ITEM_SELECTOR,
  onClose,
  rowSelector = DEFAULT_ROW_SELECTOR,
} = {}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const timelineRef = useRef(null);
  const isClosingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const closeWithAnimation = useCallback(
    (callback) => {
      if (isClosingRef.current) return;

      const overlay = overlayRef.current;
      const panel = panelRef.current;
      const complete = typeof callback === "function" ? callback : onCloseRef.current;

      isClosingRef.current = true;
      setIsClosing(true);
      timelineRef.current?.kill();

      if (!overlay || !panel || prefersReducedMotion()) {
        complete?.();
        return;
      }

      const { items, rows } = getTargets(panel, rowSelector, itemSelector);

      timelineRef.current = gsap.timeline({
        onComplete: () => {
          releaseRowMasks(rows);
          complete?.();
        },
      });

      setRevealRowMasks(gsap, rows);

      if (items.length) {
        timelineRef.current.to(items, {
          autoAlpha: 0,
          duration: MODAL_ITEM_OUT_DURATION,
          ease: "power2.inOut",
          stagger: {
            amount: Math.min(0.08, items.length * MODAL_ITEM_OUT_STAGGER),
            from: "end",
          },
          ...STABLE_TRANSFORM,
          yPercent: -24,
        }, 0);
      }

      timelineRef.current
        .to(
          panel,
          {
            autoAlpha: 0,
            duration: MODAL_PANEL_OUT_DURATION,
            ease: "power3.inOut",
            filter: MODAL_PANEL_EXIT_BLUR,
            scale: 0.985,
            ...STABLE_TRANSFORM,
            y: 18,
          },
          items.length ? 0.05 : 0,
        )
        .to(
          overlay,
          {
            autoAlpha: 0,
            duration: MODAL_OVERLAY_OUT_DURATION,
            ease: "power2.inOut",
          },
          items.length ? 0.08 : 0,
        );
    },
    [itemSelector, rowSelector],
  );

  useIsomorphicLayoutEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return undefined;

    const { items, rows } = getTargets(panel, rowSelector, itemSelector);

    timelineRef.current?.kill();

    if (prefersReducedMotion()) {
      gsap.set(overlay, { autoAlpha: 1 });
      gsap.set(panel, {
        autoAlpha: 1,
        filter: MODAL_PANEL_END_BLUR,
        scale: 1,
        y: 0,
      });
      releaseRowMasks(rows);
      if (items.length) gsap.set(items, { autoAlpha: 1, y: 0, yPercent: 0 });
      return undefined;
    }

    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(panel, {
      autoAlpha: 0,
      filter: MODAL_PANEL_START_BLUR,
      scale: 0.982,
      transformOrigin: "50% 54%",
      ...STABLE_TRANSFORM,
      willChange: "filter, transform, opacity",
      y: 30,
    });
    setRevealRowMasks(gsap, rows);
    if (items.length) {
      gsap.set(items, {
        autoAlpha: 0,
        ...STABLE_TRANSFORM,
        willChange: "transform, opacity",
        y: 0,
        yPercent: 64,
      });
    }

    timelineRef.current = gsap.timeline({
      onComplete: () => {
        releaseRowMasks(rows);
        clearEntranceProps(panel, items);
      },
    });

    timelineRef.current
      .to(overlay, {
        autoAlpha: 1,
        duration: MODAL_OVERLAY_IN_DURATION,
        ease: "power2.out",
      })
      .to(
        panel,
        {
          autoAlpha: 1,
          duration: MODAL_PANEL_IN_DURATION,
          ease: "expo.out",
          filter: MODAL_PANEL_END_BLUR,
          scale: 1,
          ...STABLE_TRANSFORM,
          y: 0,
        },
        0.04,
      );

    if (items.length) {
      timelineRef.current.to(
        items,
        {
          autoAlpha: 1,
          duration: MODAL_ITEM_IN_DURATION,
          ease: "expo.out",
          stagger: MODAL_ITEM_IN_STAGGER,
          ...STABLE_TRANSFORM,
          yPercent: 0,
        },
        0.18,
      );
    }

    return () => {
      timelineRef.current?.kill();
      releaseRowMasks(rows);
    };
  }, [itemSelector, rowSelector]);

  return {
    closeWithAnimation,
    isClosing,
    overlayRef,
    panelRef,
  };
}
