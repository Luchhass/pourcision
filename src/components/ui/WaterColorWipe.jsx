"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const WIPE_DURATION_MS = 720;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function WaterColorWipe({ color, property }) {
  const layerRef = useRef(null);
  const displayedColorRef = useRef(color);
  const timerRef = useRef(null);
  const [wipe, setWipe] = useState(null);

  useIsomorphicLayoutEffect(() => {
    if (!color) return undefined;

    const panel = layerRef.current?.parentElement;
    const displayedColor = displayedColorRef.current || color;

    if (!panel || !property) {
      displayedColorRef.current = color;
      setWipe(null);
      return undefined;
    }

    if (!displayedColor || displayedColor === color || prefersReducedMotion()) {
      window.clearTimeout(timerRef.current);
      displayedColorRef.current = color;
      panel.style.setProperty(property, color);
      panel.style.backgroundColor = "";
      setWipe(null);
      return undefined;
    }

    window.clearTimeout(timerRef.current);
    panel.style.setProperty(property, displayedColor);
    panel.style.backgroundColor = displayedColor;
    setWipe({
      color,
      key: `${displayedColor}-${color}-${Date.now()}`,
    });

    timerRef.current = window.setTimeout(() => {
      displayedColorRef.current = color;
      panel.style.setProperty(property, color);
      panel.style.backgroundColor = "";
      setWipe(null);
    }, WIPE_DURATION_MS);

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [color, property]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pc-water-color-wipe"
      data-active={wipe ? "true" : "false"}
      key={wipe?.key ?? "idle"}
      ref={layerRef}
      style={{ backgroundColor: wipe?.color ?? "transparent" }}
    />
  );
}
