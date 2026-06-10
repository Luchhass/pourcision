"use client";

import { WATER_COLORS } from "@/lib/constants";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function PourOpponentLines({
  opponentSubmissions,
  playerId,
  roundIndex,
  waterColor,
}) {
  const currentOpponentSubmissions = opponentSubmissions.filter(
    (submission) =>
      submission?.result?.roundIndex === roundIndex &&
      submission?.player?.id !== playerId,
  );

  if (!currentOpponentSubmissions.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {currentOpponentSubmissions.map((submission) => {
        const level = clamp(submission.result.level, 0, 100);
        const opponentColor =
          WATER_COLORS.find(
            (color) => color.id === submission.player?.waterColorId,
          ) || waterColor;

        return (
          <div
            className="absolute inset-x-0 border-t-2 border-dashed border-[#0d0d0c]/18"
            key={`${submission.player.id}-${submission.result.roundIndex}`}
            style={{ top: `${100 - level}%` }}
          >
            <div
              className="absolute inset-x-0 top-0 h-24 -translate-y-full"
              style={{
                background: `linear-gradient(to top, ${opponentColor.value}33, transparent)`,
              }}
            />
            <span className="pc-round-label absolute left-6 top-1 text-[#0d0d0c]/28 md:left-8">
              {submission.player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
