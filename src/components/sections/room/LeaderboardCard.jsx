"use client";

import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import { formatScore } from "@/lib/scoring";

function getLeaderboardPlayers(leaderboard) {
  return leaderboard?.players || leaderboard?.leaderboard?.players || [];
}

function roundKey(result) {
  return result.round ?? result.roundIndex ?? result.target;
}

function formatDiff(value) {
  if (value === null || value === undefined) return "--";

  return Number(value).toFixed(2);
}

export default function LeaderboardCard({
  currentPlayerId,
  error,
  isReturningLobby = false,
  leaderboard,
  onBackLobby,
  onLeave,
}) {
  const { t } = useTranslation();
  const players = getLeaderboardPlayers(leaderboard);
  const currentPlayer = players.find((player) => player.id === currentPlayerId);

  return (
    <section className="grid min-h-0 content-end gap-4 lg:col-start-2 lg:row-start-2">
      <div className="grid max-h-[40dvh] gap-3 overflow-y-auto pr-1 lg:max-h-[32dvh]">
        {players.map((player, index) => (
          <div
            className={[
              "pc-player-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-4 py-3",
              player.id === currentPlayerId
                ? "border-[#0d0d0c] bg-[#0d0d0c] text-white"
                : "border-[#0d0d0c]/14 bg-white/34 text-[#0d0d0c]",
            ].join(" ")}
            key={player.id}
          >
            <span className="pc-round-value">{index + 1}</span>
            <span className="truncate">{player.name}</span>
            <span className="pc-round-value">{formatScore(player.score)}</span>
          </div>
        ))}
      </div>
      {currentPlayer ? (
        <div className="grid grid-cols-5 gap-2">
          {currentPlayer.results.map((result) => (
            <div
              className="rounded-lg border border-[#0d0d0c]/16 bg-white/30 p-3"
              key={roundKey(result)}
            >
              <p className="pc-round-label text-[#0d0d0c]/48">
                {String(result.round).padStart(2, "0")}
              </p>
              <p className="pc-round-value mt-8">{formatScore(result.score)}</p>
              <p className="pc-round-label mt-1 text-[#0d0d0c]/42">
                {formatDiff(result.diff)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="pc-copy-strong text-[#ef2f25]">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          className="rounded-none"
          disabled={isReturningLobby}
          onClick={onBackLobby}
        >
          {isReturningLobby ? t("room.returningLobby") : t("common.playAgain")}
        </Button>
        <Button className="rounded-none" onClick={onLeave} variant="secondary">
          {t("common.mainMenu")}
        </Button>
      </div>
    </section>
  );
}
