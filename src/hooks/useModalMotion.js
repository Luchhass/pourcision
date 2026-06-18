"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const STABLE_TRANSFORM = { force3D: false };

const DEFAULT_ROW_SELECTOR = "[data-modal-reveal-row]";
const DEFAULT_ITEM_SELECTOR = "[data-modal-reveal-item]";

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

      const { items } = getTargets(panel, rowSelector, itemSelector);

      timelineRef.current = gsap.timeline({
        onComplete: () => complete?.(),
      });

      if (items.length) {
        timelineRef.current.to(items, {
          autoAlpha: 0,
          duration: 0.1,
          ease: "power2.in",
          stagger: 0.008,
          ...STABLE_TRANSFORM,
          y: 4,
        });
      }

      timelineRef.current
        .to(
          panel,
          {
            autoAlpha: 0,
            duration: 0.2,
            ease: "power2.inOut",
            scale: 0.975,
            ...STABLE_TRANSFORM,
            y: 8,
          },
          items.length ? 0.03 : 0,
        )
        .to(
          overlay,
          {
            autoAlpha: 0,
            duration: 0.18,
            ease: "power2.in",
          },
          "<",
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
      gsap.set(panel, { autoAlpha: 1, scale: 1, y: 0 });
      if (items.length) gsap.set(items, { autoAlpha: 1, y: 0 });
      return undefined;
    }

    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(panel, {
      autoAlpha: 0,
      scale: 0.96,
      transformOrigin: "50% 52%",
      ...STABLE_TRANSFORM,
      willChange: "transform, opacity",
      y: 10,
    });
    if (rows.length) {
      gsap.set(rows, { overflow: "hidden" });
    }
    if (items.length) {
      gsap.set(items, {
        autoAlpha: 0,
        ...STABLE_TRANSFORM,
        willChange: "transform, opacity",
        y: 8,
      });
    }

    timelineRef.current = gsap.timeline({
      onComplete: () => {
        gsap.set(panel, {
          clearProps: "transform,opacity,visibility,willChange",
        });
        if (rows.length) {
          gsap.set(rows, { clearProps: "overflow" });
        }
        if (items.length) {
          gsap.set(items, {
            clearProps: "transform,opacity,visibility,willChange",
          });
        }
      },
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
          autoAlpha: 1,
          duration: 0.3,
          ease: "power3.out",
          scale: 1,
          ...STABLE_TRANSFORM,
          y: 0,
        },
        "<0.02",
      );

    if (items.length) {
      timelineRef.current.to(
        items,
        {
          autoAlpha: 1,
          duration: 0.22,
          ease: "power3.out",
          stagger: 0.025,
          ...STABLE_TRANSFORM,
          y: 0,
        },
        "-=0.13",
      );
    }

    return () => {
      timelineRef.current?.kill();
    };
  }, [itemSelector, rowSelector]);

  return {
    closeWithAnimation,
    isClosing,
    overlayRef,
    panelRef,
  };
}
