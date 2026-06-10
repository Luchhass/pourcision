"use client";

import { useEffect, useRef } from "react";

const LOOP_BREAKPOINT = "(max-width: 1023.98px)";

function isLoopActive() {
  if (typeof window === "undefined") return false;

  return window.matchMedia(LOOP_BREAKPOINT).matches;
}

function getSegmentWidth(slider) {
  return slider.scrollWidth / 3;
}

export function useLoopingSlider(itemCount) {
  const sliderRef = useRef(null);
  const isAdjustingRef = useRef(false);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0) return undefined;

    const centerSlider = () => {
      if (!isLoopActive()) {
        slider.scrollLeft = 0;
        return;
      }

      const segmentWidth = getSegmentWidth(slider);
      if (segmentWidth) {
        slider.scrollLeft = segmentWidth;
      }
    };

    const frameId = window.requestAnimationFrame(centerSlider);
    window.addEventListener("resize", centerSlider);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", centerSlider);
    };
  }, [itemCount]);

  const handleScroll = () => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || !isLoopActive() || isAdjustingRef.current) {
      return;
    }

    const segmentWidth = getSegmentWidth(slider);
    if (!segmentWidth) return;

    if (slider.scrollLeft < segmentWidth * 0.45) {
      isAdjustingRef.current = true;
      slider.scrollLeft += segmentWidth;
    } else if (slider.scrollLeft > segmentWidth * 1.55) {
      isAdjustingRef.current = true;
      slider.scrollLeft -= segmentWidth;
    } else {
      return;
    }

    window.requestAnimationFrame(() => {
      isAdjustingRef.current = false;
    });
  };

  return {
    handleScroll,
    sliderRef,
  };
}
