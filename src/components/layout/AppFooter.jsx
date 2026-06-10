"use client";

import { useTranslation } from "@/hooks/useLanguage";

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="creator-tag pc-round-label whitespace-nowrap font-medium text-zinc-500">
      {t("app.createdBy")}{" "}
      <a
        href="https://furkancosar.com"
        aria-label="Visit furkancosar.com"
        data-sound="off"
        className="creator-link relative inline-block text-inherit no-underline outline-none"
      >
        furkancosar
      </a>
    </footer>
  );
}
