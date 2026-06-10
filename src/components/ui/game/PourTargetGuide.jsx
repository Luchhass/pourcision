"use client";

import { useTranslation } from "@/hooks/useLanguage";

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function ResponsiveTargetBadge({ label, value }) {
  return (
    <>
      <span className="hidden sm:inline">{label} </span>
      {formatPercent(value)}
    </>
  );
}

export default function PourTargetGuide({
  fakeTarget,
  isResultPhase,
  target,
  targetWindow = 0,
  targetGuideLabelRef,
  targetGuideLineRef,
}) {
  const hasTargetWindow = targetWindow > 0;
  const windowTop = Math.max(0, 100 - target - targetWindow / 2);
  const windowHeight = Math.min(100 - windowTop, targetWindow);
  const { t } = useTranslation();

  return (
    <>
      {fakeTarget !== null && fakeTarget !== undefined ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-40"
          data-gameplay-reveal="target-guide"
          style={{ top: `${100 - fakeTarget}%` }}
        >
          <div
            className={[
              "absolute inset-x-[-8vw] top-0 border-t-2 border-dashed",
              isResultPhase ? "border-[#ef2f25]/80 dark:border-[#f7f7f2]/90" : "border-[#0d0d0c]/40 dark:border-[#f7f7f2]/38",
            ].join(" ")}
            data-gameplay-reveal-line="true"
          />
          <span
            className={[
              "pc-label absolute right-6 top-0 -mt-5 inline-flex rounded-md px-3 py-2 text-white md:right-8",
              isResultPhase ? "bg-[#ef2f25] dark:bg-[#f7f7f2] dark:text-[#0d0d0c]" : "bg-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c]",
            ].join(" ")}
            data-gameplay-reveal-badge="true"
          >
            <ResponsiveTargetBadge
              label={isResultPhase ? t("game.fake") : t("game.target")}
              value={fakeTarget}
            />
          </span>
        </div>
      ) : null}

      {hasTargetWindow ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-40"
          data-gameplay-reveal="target-guide"
          style={{ height: `${windowHeight}%`, top: `${windowTop}%` }}
        >
          <div
            className="absolute inset-x-[-8vw] inset-y-[-0.55rem] overflow-hidden bg-transparent [transform-origin:center_center]"
            data-gameplay-reveal-line="true"
            ref={targetGuideLineRef}
          >
            <div className="absolute inset-x-0 top-[22%] border-t-2 border-dashed border-[#0d0d0c]/72 dark:border-[#f7f7f2]/62" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-[#0d0d0c]/34 dark:border-[#f7f7f2]/28" />
            <div className="absolute inset-x-0 bottom-[22%] border-t-2 border-dashed border-[#0d0d0c]/72 dark:border-[#f7f7f2]/62" />
            <div className="absolute bottom-[22%] left-6 top-[22%] w-px bg-[#0d0d0c]/46 dark:bg-[#f7f7f2]/42" />
            <div className="absolute bottom-[22%] right-6 top-[22%] w-px bg-[#0d0d0c]/46 dark:bg-[#f7f7f2]/42" />
          </div>
          <span
            className="pc-label absolute right-6 top-1/2 inline-flex -translate-y-1/2 rounded-md bg-[#0d0d0c] px-3 py-2 text-white shadow-[0_10px_24px_rgba(13,13,12,0.22)] md:right-8 dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
            data-gameplay-reveal-badge="true"
            ref={targetGuideLabelRef}
          >
            <ResponsiveTargetBadge label={t("game.tenOrZero")} value={target} />
          </span>
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 z-40"
          data-gameplay-reveal="target-guide"
          style={{ top: `${100 - target}%` }}
        >
          <div
            className="absolute inset-x-[-8vw] top-0 border-t-2 border-dashed border-[#0d0d0c]/40 [transform-origin:center_center] dark:border-[#f7f7f2]/38"
            data-gameplay-reveal-line="true"
            ref={targetGuideLineRef}
          />
          <span
            className="pc-label absolute right-6 top-0 -mt-5 inline-flex rounded-md bg-[#0d0d0c] px-3 py-2 text-white md:right-8 dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
            data-gameplay-reveal-badge="true"
            ref={targetGuideLabelRef}
          >
            <ResponsiveTargetBadge label={t("game.target")} value={target} />
          </span>
        </div>
      )}
    </>
  );
}
