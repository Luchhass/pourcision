"use client";

import { useEffect, useRef } from "react";

function getAnchorIndex(text, anchor) {
  if (typeof anchor === "number") {
    return Math.max(0, Math.min(text.length - 1, anchor));
  }

  const anchorIndex = text.indexOf(anchor);

  if (anchorIndex >= 0) {
    return anchorIndex;
  }

  return Math.max(0, Math.floor(text.length / 2));
}

export default function ReverseTitleBand({
  anchor = "S",
  rightContent,
  title,
}) {
  const heroRef = useRef(null);
  const reverseAnchorRef = useRef(null);
  const titleText = title.toUpperCase();
  const anchorIndex = getAnchorIndex(titleText, anchor);
  const titleBeforeAnchor = titleText.slice(0, anchorIndex);
  const titleAnchor = titleText.slice(anchorIndex, anchorIndex + 1);
  const titleAfterAnchor = titleText.slice(anchorIndex + 1);

  useEffect(() => {
    const hero = heroRef.current;
    const anchorElement = reverseAnchorRef.current;

    if (!hero || !anchorElement) {
      return undefined;
    }

    const updateReverseWidth = () => {
      const heroRect = hero.getBoundingClientRect();
      const anchorRect = anchorElement.getBoundingClientRect();
      const nextWidth =
        anchorRect.left - heroRect.left + anchorRect.width / 2;

      hero.style.setProperty("--reverse-width", `${nextWidth}px`);
    };

    updateReverseWidth();

    const resizeObserver = new ResizeObserver(updateReverseWidth);
    resizeObserver.observe(hero);
    resizeObserver.observe(anchorElement);

    window.addEventListener("resize", updateReverseWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateReverseWidth);
    };
  }, []);

  return (
    <section
      className="pc-title-band relative -mx-6 -mt-6 grid min-w-0 grid-rows-[auto_auto] gap-5 overflow-hidden p-6 [--home-pad:1.5rem] [--reverse-width:52vw] md:-mx-8 md:-mt-8 md:p-8 md:[--home-pad:2rem] lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-1 lg:gap-x-4"
      ref={heroRef}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[var(--reverse-width)] bg-[#0d0d0c]"
      />

      {rightContent ? (
        <div className="relative z-20 row-start-1 justify-self-end lg:col-start-2 lg:row-start-1">
          {rightContent}
        </div>
      ) : null}

      <div
        className="pc-title-stack relative z-10 row-start-2 min-w-0 lg:col-start-1 lg:row-start-1"
        style={{ "--pc-title-length": titleText.length }}
      >
        <h1
          className="pc-page-title pc-page-title-fit text-[#0d0d0c]"
        >
          {titleBeforeAnchor}
          <span ref={reverseAnchorRef}>{titleAnchor}</span>
          {titleAfterAnchor}
        </h1>
        <h1
          aria-hidden="true"
          className="pc-page-title pc-page-title-fit pointer-events-none absolute inset-x-0 top-0 overflow-hidden text-[#f7f7f2] [clip-path:inset(0_calc(100%_-_(var(--reverse-width)_-_var(--home-pad)))_0_0)]"
        >
          {titleText}
        </h1>
      </div>
    </section>
  );
}
