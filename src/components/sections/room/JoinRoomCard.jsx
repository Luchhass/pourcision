"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import {
  readSessionPlayerName,
  saveSessionPlayerName,
} from "@/lib/playerNamePreference";

export default function JoinRoomCard({
  error,
  isJoining,
  onJoin,
  room,
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState(readSessionPlayerName);
  const [showPassword, setShowPassword] = useState(false);
  const requiresPassword = Boolean(room?.hasPassword);
  const PasswordIcon = showPassword ? EyeOff : Eye;
  const handlePlayerNameChange = (nextPlayerName) => {
    setPlayerName(nextPlayerName);
    saveSessionPlayerName(nextPlayerName);
  };

  return (
    <section className="grid w-full min-w-0 content-start gap-5 lg:w-[82%] lg:min-w-[28rem] lg:max-w-[52rem]">
      <div className="grid min-w-0 gap-5">
        <label className="grid min-w-0 gap-2.5">
          <span className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
            {t("setup.playerName")}
          </span>
          <input
            className="pc-field w-full bg-[#0d0d0c]/[0.12] px-4 text-[#0d0d0c] outline-none transition-colors duration-200 placeholder:text-[#0d0d0c]/58 focus-visible:bg-[#0d0d0c]/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/10 dark:text-[#f7f7f2] dark:placeholder:text-[#f7f7f2]/42 dark:focus-visible:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
            maxLength={24}
            onChange={(event) => handlePlayerNameChange(event.target.value)}
            placeholder="Player"
            spellCheck={false}
            value={playerName}
          />
        </label>

        {requiresPassword ? (
          <label className="grid min-w-0 gap-2.5">
            <span className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
              {t("setup.lobbyPassword")}
            </span>
            <div className="relative">
              <input
                autoComplete="off"
                className="pc-field w-full bg-[#0d0d0c]/[0.12] px-4 pr-[var(--pc-choice-height)] text-[#0d0d0c] outline-none transition-colors duration-200 placeholder:text-[#0d0d0c]/58 focus-visible:bg-[#0d0d0c]/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/10 dark:text-[#f7f7f2] dark:placeholder:text-[#f7f7f2]/42 dark:focus-visible:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-[var(--pc-choice-height)] place-items-center text-[#0d0d0c]/70 transition-colors duration-200 hover:text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2]/70 dark:hover:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <PasswordIcon aria-hidden="true" className="pc-icon" strokeWidth={3} />
              </button>
            </div>
          </label>
        ) : null}
      </div>

      {error ? <p className="pc-copy-strong text-[#0d0d0c] dark:text-[#f7f7f2]">{error}</p> : null}

      <Button
        className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
        disabled={isJoining}
        onClick={() => onJoin(playerName.trim() || "Player", password.trim())}
      >
        {isJoining ? t("room.joining") : t("room.join")}
      </Button>
    </section>
  );
}
