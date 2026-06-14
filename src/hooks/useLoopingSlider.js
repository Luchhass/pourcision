"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const LOOP_BREAKPOINT = "(max-width: 1023.98px)";
const DRAG_THRESHOLD_PX = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isLoopActive(mode) {
  if (mode === "always") return true;
  if (typeof window === "undefined") return false;

  return window.matchMedia(LOOP_BREAKPOINT).matches;
}

function getSegmentWidth(slider) {
  return slider.scrollWidth / 3;
}

export function useLoopingSlider(
  itemCount,
  {
    disabled = false,
    getWheelStep = null,
    loop = "responsive",
    wheelDuration = 0.76,
  } = {},
) {
  const sliderRef = useRef(null);
  const targetLeftRef = useRef(0);
  const tweenRef = useRef(null);
  const velocityRef = useRef({
    lastTime: 0,
    lastX: 0,
    scrollVelocity: 0,
  });
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    scrollLeft: 0,
    x: 0,
    y: 0,
  });
  const suppressClickRef = useRef(false);

  const normalizeCurrentPosition = (targetLeft = null) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || !isLoopActive(loop)) {
      return { shift: 0, targetLeft };
    }

    const segmentWidth = getSegmentWidth(slider);
    if (!segmentWidth) return { shift: 0, targetLeft };

    let shift = 0;
    if (slider.scrollLeft < segmentWidth * 0.45) {
      shift = segmentWidth;
    } else if (slider.scrollLeft > segmentWidth * 1.55) {
      shift = -segmentWidth;
    }

    if (!shift) return { shift: 0, targetLeft };

    slider.scrollLeft += shift;
    return {
      shift,
      targetLeft: targetLeft === null ? targetLeft : targetLeft + shift,
    };
  };

  const prepareLoopTarget = (targetLeft) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || !isLoopActive(loop)) return targetLeft;

    const segmentWidth = getSegmentWidth(slider);
    if (!segmentWidth) return targetLeft;

    let nextTarget = normalizeCurrentPosition(targetLeft).targetLeft ?? targetLeft;

    while (nextTarget < segmentWidth * 0.5) {
      slider.scrollLeft += segmentWidth;
      nextTarget += segmentWidth;
    }

    while (nextTarget > segmentWidth * 1.5) {
      slider.scrollLeft -= segmentWidth;
      nextTarget -= segmentWidth;
    }

    return nextTarget;
  };

  const stopTween = () => {
    tweenRef.current?.kill();
    tweenRef.current = null;
  };

  const animateScrollTo = (targetLeft, duration = 0.72) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || disabled) return;

    stopTween();
    targetLeftRef.current = prepareLoopTarget(targetLeft);

    tweenRef.current = gsap.to(slider, {
      duration,
      ease: "power4.out",
      overwrite: true,
      scrollLeft: targetLeftRef.current,
      onComplete: () => {
        tweenRef.current = null;
        const { shift } = normalizeCurrentPosition();
        if (shift) {
          targetLeftRef.current += shift;
        } else {
          targetLeftRef.current = slider.scrollLeft;
        }
      },
    });
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0) return undefined;

    const centerSlider = () => {
      stopTween();

      if (!isLoopActive(loop)) {
        slider.scrollLeft = 0;
        targetLeftRef.current = 0;
        return;
      }

      const segmentWidth = getSegmentWidth(slider);
      if (segmentWidth) {
        slider.scrollLeft = segmentWidth;
        targetLeftRef.current = segmentWidth;
      }
    };

    const frameId = window.requestAnimationFrame(centerSlider);
    window.addEventListener("resize", centerSlider);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", centerSlider);
      stopTween();
    };
  }, [itemCount, loop]);

  const handleScroll = () => {
    const drag = dragRef.current;
    if (drag.active || tweenRef.current) return;

    normalizeCurrentPosition();
  };

  const handlePointerDown = (event) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    stopTween();
    velocityRef.current = {
      lastTime: window.performance.now(),
      lastX: event.clientX,
      scrollVelocity: 0,
    };
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
    if (
      !slider ||
      !drag.active ||
      drag.pointerId !== event.pointerId ||
      disabled
    ) {
      return;
    }

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
      slider.setPointerCapture?.(event.pointerId);
    }

    if (!drag.moved) return;

    event.preventDefault();
    slider.scrollLeft = drag.scrollLeft - deltaX;
    targetLeftRef.current = slider.scrollLeft;

    const { shift } = normalizeCurrentPosition();
    if (shift) {
      drag.scrollLeft += shift;
      targetLeftRef.current += shift;
    }

    const now = window.performance.now();
    const elapsed = Math.max(12, now - velocityRef.current.lastTime);
    const movement = event.clientX - velocityRef.current.lastX;
    velocityRef.current = {
      lastTime: now,
      lastX: event.clientX,
      scrollVelocity: -movement / elapsed,
    };
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

    if (drag.moved && slider && !disabled) {
      const segmentWidth = getSegmentWidth(slider) || slider.clientWidth || 1;
      const maxGlide = Math.min(segmentWidth * 0.36, 420);
      const glideDistance = clamp(
        velocityRef.current.scrollVelocity * 340,
        -maxGlide,
        maxGlide,
      );

      if (Math.abs(glideDistance) > 3) {
        animateScrollTo(slider.scrollLeft + glideDistance, 0.94);
        return;
      }
    }

    const { shift } = normalizeCurrentPosition();
    if (shift) {
      targetLeftRef.current += shift;
    } else if (slider) {
      targetLeftRef.current = slider.scrollLeft;
    }
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleWheel = (event) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || disabled) return;

    const rawDelta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    if (!rawDelta) return;

    event.preventDefault();
    const { shift } = normalizeCurrentPosition();
    if (shift) {
      targetLeftRef.current += shift;
    }

    const wheelStep =
      typeof getWheelStep === "function"
        ? getWheelStep(slider)
        : clamp(Math.abs(rawDelta), 80, 220);
    const baseLeft = tweenRef.current ? targetLeftRef.current : slider.scrollLeft;

    animateScrollTo(baseLeft + Math.sign(rawDelta) * wheelStep, wheelDuration);
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
