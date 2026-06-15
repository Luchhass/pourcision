"use client";

import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";

export default function RoomMessageCard({
  message,
  onBackHome,
  title,
  variant = "card",
}) {
  const { t } = useTranslation();

  if (variant === "minimal") {
    return (
      <section className="grid h-full min-h-0 w-full min-w-0 content-end lg:max-w-full xl:w-[82%] xl:min-w-[28rem] xl:max-w-[52rem]">
        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          onClick={onBackHome}
        >
          {t("common.mainMenu")}
        </Button>
      </section>
    );
  }

  return (
    <section className="grid w-full min-w-0 content-start gap-5 lg:max-w-full xl:w-[82%] xl:min-w-[28rem] xl:max-w-[52rem]">
      <div className="grid min-w-0 shadow-[0_22px_48px_rgba(13,13,12,0.08)] min-[520px]:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)]">
        <div className="grid min-h-[126px] content-center bg-[#0d0d0c] px-6 py-5 text-[#f7f7f2]">
          <p className="pc-label text-[#f7f7f2]/62">
            {t("room.lobby")}
          </p>
          <h2 className="pc-card-title mt-3">
            {title}
          </h2>
        </div>

        <div className="grid min-h-[126px] content-center bg-[#f7f7f2]/96 px-6 py-5">
          <p className="pc-copy-strong max-w-[24rem] text-[#0d0d0c]/66">
            {message}
          </p>
        </div>
      </div>

      <Button
        className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
        onClick={onBackHome}
      >
        {t("common.mainMenu")}
      </Button>
    </section>
  );
}
