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

function getScrollBounds(slider, loop) {
  if (!slider) return { max: 0, min: 0 };
  if (isLoopActive(loop)) {
    return { max: Number.POSITIVE_INFINITY, min: Number.NEGATIVE_INFINITY };
  }

  return {
    max: Math.max(0, slider.scrollWidth - slider.clientWidth),
    min: 0,
  };
}

function clampScrollLeft(slider, value, loop) {
  const { max, min } = getScrollBounds(slider, loop);

  return clamp(value, min, max);
}

export function useLoopingSlider(
  itemCount,
  {
    disabled = false,
    getWheelStep = null,
    loop = "responsive",
    lockTouchDrag = false,
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
    touchLocked: false,
    scrollLeft: 0,
    x: 0,
    y: 0,
  });
  const dragFrameRef = useRef(null);
  const pendingDragLeftRef = useRef(null);
  const savedTouchActionRef = useRef("");
  const suppressClickRef = useRef(false);

  const normalizeCurrentPosition = (targetLeft = null) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0) {
      return { shift: 0, targetLeft };
    }

    if (!isLoopActive(loop)) {
      const nextLeft = clampScrollLeft(
        slider,
        targetLeft === null ? slider.scrollLeft : targetLeft,
        loop,
      );

      if (slider.scrollLeft !== nextLeft) {
        slider.scrollLeft = nextLeft;
      }

      return { shift: 0, targetLeft: targetLeft === null ? targetLeft : nextLeft };
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

  const clearDragFrame = () => {
    if (!dragFrameRef.current) return;

    window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
  };

  const applyPendingDragScroll = () => {
    dragFrameRef.current = null;

    const slider = sliderRef.current;
    const pendingLeft = pendingDragLeftRef.current;
    pendingDragLeftRef.current = null;
    if (!slider || pendingLeft === null) return;

    const drag = dragRef.current;
    slider.scrollLeft = clampScrollLeft(slider, pendingLeft, loop);
    targetLeftRef.current = slider.scrollLeft;

    const { shift } = normalizeCurrentPosition();
    if (shift) {
      if (drag.active) {
        drag.scrollLeft += shift;
      }
      targetLeftRef.current += shift;
    }
  };

  const flushPendingDragScroll = () => {
    clearDragFrame();
    applyPendingDragScroll();
  };

  const scheduleDragScroll = (targetLeft) => {
    pendingDragLeftRef.current = targetLeft;
    if (dragFrameRef.current) return;

    dragFrameRef.current = window.requestAnimationFrame(applyPendingDragScroll);
  };

  const animateScrollTo = (targetLeft, duration = 0.72) => {
    const slider = sliderRef.current;
    if (!slider || itemCount <= 0 || disabled) return;

    stopTween();
    targetLeftRef.current = clampScrollLeft(
      slider,
      prepareLoopTarget(targetLeft),
      loop,
    );

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
      clearDragFrame();
      pendingDragLeftRef.current = null;
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
    clearDragFrame();
    pendingDragLeftRef.current = null;
    velocityRef.current = {
      lastTime: window.performance.now(),
      lastX: event.clientX,
      scrollVelocity: 0,
    };
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      touchLocked: lockTouchDrag && event.pointerType !== "mouse",
      scrollLeft: slider.scrollLeft,
      x: event.clientX,
      y: event.clientY,
    };

    if (lockTouchDrag && event.pointerType !== "mouse") {
      savedTouchActionRef.current = slider.style.touchAction;
      slider.style.touchAction = "none";
      slider.setPointerCapture?.(event.pointerId);
    }
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
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const dragThreshold = drag.touchLocked ? 2 : DRAG_THRESHOLD_PX;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > dragThreshold) {
      if (
        !drag.touchLocked &&
        event.pointerType !== "mouse" &&
        absY > absX * 1.12
      ) {
        drag.active = false;
        return;
      }

      drag.moved = true;
      if (!drag.touchLocked) {
        savedTouchActionRef.current = slider.style.touchAction;
        slider.style.touchAction = "none";
        slider.setPointerCapture?.(event.pointerId);
      }
    }

    if (!drag.moved) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    scheduleDragScroll(drag.scrollLeft - deltaX);

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

    flushPendingDragScroll();

    if (slider) {
      slider.style.touchAction = savedTouchActionRef.current;
      savedTouchActionRef.current = "";
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
      touchLocked: false,
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
        animateScrollTo(
          clampScrollLeft(slider, slider.scrollLeft + glideDistance, loop),
          0.94,
        );
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

    if (event.cancelable) {
      event.preventDefault();
    }
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
