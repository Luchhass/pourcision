"use client";

import { useRef } from "react";
import AppFooter from "@/components/layout/AppFooter";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import SectionWord from "@/components/layout/SectionWord";
import WaterColorWipe from "@/components/ui/WaterColorWipe";
import { useTranslation } from "@/hooks/useLanguage";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import { WATER_COLORS } from "@/lib/constants";

function RoomTitleBand({ onBackHome, title }) {
  const { t } = useTranslation();
  const titleText = title.toUpperCase();

  return (
    <section
      className="pc-title-band relative min-w-0 overflow-hidden px-6 py-6 pr-16 [--room-pad:1.5rem] [--reverse-width:min(54vw,26rem)] md:px-8 md:py-8 md:pr-20 md:[--room-pad:2rem] lg:px-10 lg:py-10 lg:pr-10 lg:[--room-pad:2.5rem] lg:[--reverse-width:var(--room-split-x)]"
      data-room-title="true"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[var(--reverse-width)] bg-[#0d0d0c] dark:bg-[#161616]"
        data-room-title-fill="true"
      />

      <div
        className="pc-title-stack relative z-10 min-w-0"
        data-screen-reveal="title"
        style={{ "--pc-title-length": titleText.length }}
      >
        <h1
          className="pc-page-title pc-page-title-fit text-[#0d0d0c] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
        <h1
          aria-hidden="true"
          className="pc-page-title pc-page-title-fit pointer-events-none absolute inset-x-0 top-0 overflow-hidden text-[#f7f7f2] [clip-path:inset(0_calc(100%_-_(var(--reverse-width)_-_var(--room-pad)))_0_0)] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
      </div>

      <button
        aria-label={t("common.mainMenu")}
        className="pc-icon-button fixed right-3 top-3 z-[60] grid place-items-center text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] md:right-4 md:top-4 dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
        onClick={onBackHome}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="pc-icon"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </section>
  );
}

function RoomIntro({ description }) {
  const paragraphs = Array.isArray(description) ? description : [description];

  return (
    <div
      className="pc-copy grid max-w-[40rem] gap-3 text-[#0d0d0c]/66 lg:max-w-[calc(50vw-5rem)] dark:text-[#f7f7f2]/68"
      data-room-intro="true"
      data-screen-reveal="cream"
    >
      {paragraphs.map((paragraph) => (
        <p
          className="overflow-hidden"
          data-screen-reveal-row="true"
          key={paragraph}
        >
          <span className="block">{paragraph}</span>
        </p>
      ))}
    </div>
  );
}

export default function RoomCardShell({
  children,
  description,
  leftContent = null,
  onBackHome,
  revealKey = "",
  title,
  waterContentPlacement = "end",
  waterColorId,
}) {
  const { locale, t } = useTranslation();
  const selectedWaterColor =
    WATER_COLORS.find((color) => color.id === waterColorId) ?? WATER_COLORS[2];
  const startsAtTop = waterContentPlacement === "start";
  const roomRevealRef = useRef(null);
  useScreenReveal(roomRevealRef, [
    revealKey,
    title,
    waterContentPlacement,
    locale,
  ], {
    waterRevealKey: revealKey === "join" ? "room-direct-join" : "",
  });

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-[#f7f7f2] text-[#0d0d0c] dark:bg-[#0d0d0c] dark:text-[#f7f7f2]"
      data-room-screen="true"
      ref={roomRevealRef}
      style={{
        "--room-split-x": "50vw",
        "--room-water-color": selectedWaterColor.value,
        "--room-water-background":
          selectedWaterColor.background || selectedWaterColor.value,
      }}
    >
      <PageUtilitySwitches placement="rail" />
      <main className="relative z-10 grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_1fr]">
        <RoomTitleBand onBackHome={onBackHome} title={title} />

        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] content-start lg:grid-rows-none lg:min-h-0 lg:grid-cols-[var(--room-split-x)_minmax(0,1fr)] lg:content-stretch">
          <section className="mx-auto grid w-full max-w-[44rem] content-start min-w-0 px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:content-stretch lg:px-10 lg:pb-10 lg:pt-16">
            <RoomIntro description={description} />

            <div className="hidden min-h-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-8 lg:grid">
              <div className="shrink-0">
                <div data-screen-reveal="cream">
                  <div className="overflow-hidden" data-screen-reveal-row="true">
                    <AppFooter />
                  </div>
                </div>
              </div>
              <div
                className="grid min-w-0 justify-items-center gap-7"
                data-screen-reveal="cream"
              >
                {leftContent}
              </div>
            </div>
          </section>

          <section
            className={[
              "relative mx-auto grid w-full max-w-[44rem] min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-8 [background:var(--room-water-background)] px-6 pb-8 pt-8 md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:gap-8 lg:p-10 dark:[background:#161616]",
              "max-lg:content-stretch",
            ].join(" ")}
            data-room-water="true"
            data-premium-water={selectedWaterColor.animated ? "true" : undefined}
            data-screen-reveal="water-bg"
          >
            <WaterColorWipe
              animated={selectedWaterColor.animated}
              color={selectedWaterColor.background || selectedWaterColor.value}
              property="--room-water-background"
            />
            <SectionWord
              primary={title.toUpperCase()}
              secondary={t("room.lobby")}
            />
            <div className="grid h-full min-h-0 min-w-0 gap-5 md:gap-6 lg:h-full lg:min-h-0 lg:gap-0">
              <div
                className={[
                  "min-h-0 w-full",
                  startsAtTop
                    ? "grid h-full content-stretch lg:flex lg:items-stretch lg:justify-end"
                    : "grid content-start justify-items-stretch lg:content-end lg:justify-items-end",
                ].join(" ")}
                data-room-content-panel="true"
                data-screen-reveal="water-content"
                data-screen-reveal-direction="down"
              >
                {children}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
