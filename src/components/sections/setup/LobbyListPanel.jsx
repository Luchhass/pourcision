"use client";

import { Lock, Search, Users } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useLobbyList } from "@/hooks/useLobbyList";
import { useTranslation } from "@/hooks/useLanguage";
import { DIFFICULTY_OPTIONS, GAME_MODE_OPTIONS } from "@/lib/constants";

function optionLabel(options, id) {
  return options.find((option) => option.id === id)?.label || id;
}

function RoomListRow({ disabled, onSelect, room, selected }) {
  return (
    <button
      className={[
        "pc-choice grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 text-left transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? "bg-[#0d0d0c] text-white"
          : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-[#f7f7f2]",
      ].join(" ")}
      disabled={disabled}
      onClick={() => onSelect(room.code)}
      type="button"
    >
      <span className="min-w-0">
        <span className="pc-choice-text block truncate">
          {room.name || `Room ${room.code}`}
        </span>
        <span
          className={[
            "pc-round-label mt-2 block truncate",
            selected ? "text-white/58" : "text-[#0d0d0c]/48",
          ].join(" ")}
        >
          #{room.code} / {optionLabel(GAME_MODE_OPTIONS, room.ruleMode)} /{" "}
          {optionLabel(DIFFICULTY_OPTIONS, room.difficulty)}
        </span>
      </span>
      <span className="pc-choice-text flex items-center gap-2">
        {room.hasPassword ? <Lock className="pc-icon" strokeWidth={2.4} /> : null}
        <Users className="pc-icon" strokeWidth={2.4} />
        {room.playerCount}/{room.maxPlayers}
      </span>
    </button>
  );
}

export default function LobbyListPanel({ isJoining, onJoin }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const {
    error,
    isLoading,
    searchQuery,
    selectedRoom,
    selectedRoomCode,
    setSearchQuery,
    setSelectedRoomCode,
    visibleRooms,
  } = useLobbyList(true);

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-full">
      <div className="space-y-3">
        <p className="pc-label text-[#0d0d0c]/62">
          {t("setup.lobbyList")}
        </p>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pc-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0d0d0c]/38"
            strokeWidth={2.3}
          />
          <input
            className="pc-field w-full bg-[#f7f7f2]/96 pl-11 pr-4 text-[#0d0d0c] outline-none transition-colors duration-200 focus-visible:bg-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("setup.searchLobby")}
            value={searchQuery}
          />
        </div>
      </div>

      <div className="grid min-h-[8.75rem] max-h-[clamp(8.75rem,24dvh,13rem)] auto-rows-[var(--pc-choice-height)] content-start gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleRooms.length ? (
          visibleRooms.map((room) => (
            <RoomListRow
              disabled={isJoining || room.playerCount >= room.maxPlayers}
              key={room.code}
              onSelect={(roomCode) => {
                setSelectedRoomCode(roomCode);
                setPassword("");
              }}
              room={room}
              selected={room.code === selectedRoomCode}
            />
          ))
        ) : (
          <div className="grid place-items-center bg-[#f7f7f2]/88 p-5 text-center">
            <p className="pc-label text-[#0d0d0c]/42">
              {isLoading ? t("common.loading") : t("setup.noLobbies")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-4 pt-5">
        {selectedRoom?.hasPassword ? (
          <input
            autoComplete="off"
            className="pc-field w-full bg-[#f7f7f2]/96 px-4 text-[#0d0d0c] outline-none transition-colors duration-200 focus-visible:bg-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("setup.lobbyPassword")}
            type="password"
            value={password}
          />
        ) : null}

        {error ? (
          <p className="pc-copy-strong text-[#0d0d0c]">{error}</p>
        ) : null}

        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          disabled={isJoining || !selectedRoom}
          onClick={() =>
            onJoin({
              password,
              roomCode: selectedRoom?.code,
            })
          }
        >
          {isJoining ? t("room.joining") : t("room.join")}
        </Button>
      </div>
    </div>
  );
}
