"use client";

import { Globe2, Lock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useLobbyList } from "@/hooks/useLobbyList";
import { useTranslation } from "@/hooks/useLanguage";
import { useModalMotion } from "@/hooks/useModalMotion";

function LobbyPasswordModal({
  isJoining,
  onClose,
  onJoin,
  password,
  setPassword,
}) {
  const { t } = useTranslation();
  const { closeWithAnimation, isClosing, overlayRef, panelRef } =
    useModalMotion({ onClose });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeWithAnimation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWithAnimation]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-[#0d0d0c]/45 p-4 opacity-0 backdrop-blur-[2px] md:place-items-center"
      ref={overlayRef}
    >
      <button
        aria-label={t("room.closeSettings")}
        className="absolute inset-0 cursor-default"
        disabled={isClosing}
        onClick={closeWithAnimation}
        type="button"
      />
      <section
        className="relative z-10 grid w-full max-w-[26rem] gap-6 bg-[#f7f7f2] p-5 text-[#0d0d0c] shadow-[0_28px_80px_rgba(13,13,12,0.34)] dark:bg-[#161616] dark:text-[#f7f7f2]"
        ref={panelRef}
      >
        <div className="flex items-start justify-between gap-5" data-modal-reveal-row="true">
          <h2 className="pc-label text-[#0d0d0c]/70 dark:text-[#f7f7f2]/70">
            <span className="block" data-modal-reveal-item="true">
              {t("setup.lobbyPassword")}
            </span>
          </h2>
          <button
            aria-label={t("room.closeSettings")}
            className="grid size-10 shrink-0 place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
            data-modal-reveal-item="true"
            disabled={isClosing}
            onClick={closeWithAnimation}
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
        </div>
        <div className="grid gap-4" data-modal-reveal-row="true">
          <input
            autoComplete="off"
            autoFocus
            className="pc-field w-full bg-[#0d0d0c]/8 px-4 text-[#0d0d0c] outline-none transition-colors duration-200 focus-visible:bg-[#0d0d0c]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/10 dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
            data-modal-reveal-item="true"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onJoin();
            }}
            placeholder={t("setup.lobbyPassword")}
            type="password"
            value={password}
          />
          <Button
            className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
            data-modal-reveal-item="true"
            disabled={isJoining || isClosing}
            onClick={onJoin}
          >
            {isJoining ? t("room.joining") : t("room.join")}
          </Button>
        </div>
      </section>
    </div>
  );
}

function RoomListRow({ disabled, onSelect, room, selected }) {
  const VisibilityIcon = room.hasPassword ? Lock : Globe2;

  return (
    <button
      className={[
        "pc-choice grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 text-left transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? "bg-[#0d0d0c] text-white"
          : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-[#f7f7f2]",
      ].join(" ")}
      disabled={disabled}
      data-screen-reveal-row="true"
      data-screen-reveal-target="self"
      onClick={() => onSelect(room.code)}
      type="button"
    >
      <VisibilityIcon
        aria-hidden="true"
        className="pc-icon shrink-0"
        strokeWidth={2.4}
      />
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
          #{room.code}
        </span>
      </span>
      <span className="pc-choice-text flex items-center gap-2">
        <Users className="pc-icon" strokeWidth={2.4} />
        {room.playerCount}/{room.maxPlayers}
      </span>
    </button>
  );
}

export default function LobbyListPanel({ isJoining, onJoin }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const {
    error,
    isLoading,
    selectedRoom,
    selectedRoomCode,
    setSelectedRoomCode,
    visibleRooms,
  } = useLobbyList(true);

  return (
    <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 md:gap-5">
      <div className="space-y-3" data-screen-reveal-row="true" data-screen-reveal-target="self">
        <p className="pc-label text-[#0d0d0c]/62">
          {t("setup.lobbyList")}
        </p>
        {/*
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
        */}
      </div>

      <div
        className={[
          "grid h-full min-h-0 gap-2 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          visibleRooms.length
            ? "auto-rows-[var(--pc-choice-height)] content-start"
            : "grid-rows-[minmax(0,1fr)] content-stretch",
        ].join(" ")}
      >
        {visibleRooms.length ? (
          visibleRooms.map((room) => (
            <RoomListRow
              disabled={isJoining || room.playerCount >= room.maxPlayers}
              key={room.code}
              onSelect={(roomCode) => {
                setSelectedRoomCode((currentRoomCode) =>
                  currentRoomCode === roomCode ? "" : roomCode,
                );
                setPassword("");
                setIsPasswordModalOpen(false);
              }}
              room={room}
              selected={room.code === selectedRoomCode}
            />
          ))
        ) : (
          <div
            className="grid h-full place-items-center text-center"
            data-screen-reveal-row="true"
            data-screen-reveal-target="self"
          >
            <p className="pc-label text-[#0d0d0c]/42">
              {isLoading ? t("common.loading") : t("setup.noLobbies")}
            </p>
          </div>
        )}
      </div>

      <div
        className="grid gap-4"
        data-screen-reveal-row="true"
        data-screen-reveal-target="children"
      >
        {error ? (
          <p className="pc-copy-strong text-[#0d0d0c]">{error}</p>
        ) : null}

        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          disabled={isJoining || !selectedRoom}
          onClick={() => {
            if (selectedRoom?.hasPassword) {
              setIsPasswordModalOpen(true);
              return;
            }

            onJoin({
              password,
              roomCode: selectedRoom?.code,
            });
          }}
        >
          {isJoining
            ? t("room.joining")
            : selectedRoom?.hasPassword
              ? t("setup.enterLobbyPassword")
              : t("room.join")}
        </Button>
      </div>

      {isPasswordModalOpen && selectedRoom ? (
        <LobbyPasswordModal
          isJoining={isJoining}
          onClose={() => setIsPasswordModalOpen(false)}
          onJoin={() =>
            onJoin({
              password,
              roomCode: selectedRoom.code,
            })
          }
          password={password}
          setPassword={setPassword}
        />
      ) : null}
    </div>
  );
}
