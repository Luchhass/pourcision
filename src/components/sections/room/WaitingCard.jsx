"use client";

import { useTranslation } from "@/hooks/useLanguage";

function clampCount(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.round(number));
}

export default function WaitingCard({
  remainingCount = 0,
  totalCount = 0,
}) {
  const { t } = useTranslation();
  const safeRemainingCount = clampCount(remainingCount);
  const safeTotalCount = Math.max(
    clampCount(totalCount),
    safeRemainingCount,
  );
  const returnedCount = Math.max(0, safeTotalCount - safeRemainingCount);
  const progress = safeTotalCount > 0
    ? Math.min(100, Math.max(0, (returnedCount / safeTotalCount) * 100))
    : 0;

  return (
    <section className="grid h-full min-h-0 w-full min-w-0 content-end justify-items-end lg:w-[82%] lg:min-w-[28rem] lg:max-w-[52rem]">
      <div className="w-full max-w-[18rem] text-right">
        <div className="flex items-end justify-end gap-3">
          <p className="pc-label pb-2 text-[#0d0d0c]/54 dark:text-[#f7f7f2]/48">
            {t("room.finishedShort")}
          </p>
          <p className="pc-result-score-compact leading-none text-[#0d0d0c] dark:text-[#f7f7f2]">
            {returnedCount}
            <span className="pc-score-denominator ml-2 text-[#0d0d0c]/42 dark:text-[#f7f7f2]/34">
              / {safeTotalCount}
            </span>
          </p>
        </div>

        <div
          aria-label={`${returnedCount} / ${safeTotalCount}`}
          className="mt-5 h-2 w-full overflow-hidden bg-[#0d0d0c]/16 dark:bg-[#f7f7f2]/12"
          role="meter"
          aria-valuemax={safeTotalCount}
          aria-valuemin={0}
          aria-valuenow={returnedCount}
        >
          <span
            className="block h-full bg-[#0d0d0c] transition-[width] duration-500 ease-out dark:bg-[#f7f7f2]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
