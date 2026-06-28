"use client";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatLevel(value) {
  return `${clamp(Number(value) || 0, 0, 100).toFixed(0)}%`;
}

export default function PourOpponentLines({
  opponentSubmissions,
  playerId,
  roundIndex,
}) {
  const currentOpponentSubmissions = opponentSubmissions.filter(
    (submission) =>
      submission?.result?.roundIndex === roundIndex &&
      submission?.player?.id !== playerId,
  );

  if (!currentOpponentSubmissions.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {currentOpponentSubmissions.map((submission, index) => {
        const level = clamp(submission.result.level, 0, 100);
        const markerSide =
          index % 2 === 0 ? "left-6 md:left-8" : "right-6 md:right-8";
        const markerOffset = (index % 3) * 8 - 8;

        return (
          <div
            className="absolute inset-x-0 h-0"
            key={`${submission.player.id}-${submission.result.roundIndex}`}
            style={{ top: `${100 - level}%` }}
          >
            <span
              className={`pc-label absolute top-0 flex h-7 max-w-[min(10.5rem,38vw)] items-center gap-2 overflow-hidden rounded-md border border-current bg-transparent px-2.5 text-[#0d0d0c]/82 dark:text-[#f7f7f2]/82 ${markerSide}`}
              style={{ transform: `translateY(calc(-50% + ${markerOffset}px))` }}
            >
              <span className="min-w-0 truncate">
                {submission.player.name || `P${index + 1}`}
              </span>
              <span className="ml-auto tabular-nums">{formatLevel(level)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
