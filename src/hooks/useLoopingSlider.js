"use client";

import { useEffect, useRef } from "react";

const LOOP_BREAKPOINT = "(max-width: 1023.98px)";
const DRAG_THRESHOLD_PX = 6;

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
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    scrollLeft: 0,
    x: 0,
    y: 0,
  });
  const suppressClickRef = useRef(false);

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

  const normalizeScrollPosition = () => {
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

  const handlePointerDown = (event) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: slider.scrollLeft,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event) => {
    const slider = sliderRef.current;
    const drag = dragRef.current;
    if (!slider || !drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
      slider.setPointerCapture?.(event.pointerId);
    }

    if (!drag.moved) return;

    event.preventDefault();
    slider.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handlePointerUp = (event) => {
    const slider = sliderRef.current;
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (slider?.hasPointerCapture?.(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragRef.current = {
      active: false,
      moved: false,
      pointerId: null,
      scrollLeft: 0,
      x: 0,
      y: 0,
    };
    normalizeScrollPosition();
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleWheel = (event) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0) return;

    const delta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    if (!delta) return;

    event.preventDefault();
    slider.scrollLeft += delta;
    if (isLoopActive()) {
      normalizeScrollPosition();
    }
  };

  return {
    handleClickCapture,
    handlePointerCancel: handlePointerUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    handleWheel,
    sliderRef,
  };
}
