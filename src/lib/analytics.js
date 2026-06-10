export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_ID ||
  "";
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.NEXT_PUBLIC_GSC_ID ||
  "";

export function initializeAnalytics() {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  if (!window.__pourcisionGaConfigured) {
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    window.__pourcisionGaConfigured = true;
  }

  return true;
}

export function trackEvent(name, params = {}) {
  if (!initializeAnalytics()) return;

  window.gtag("event", name, params);
}

export function trackPageView({ pageLocation, pagePath, pageTitle }) {
  if (!initializeAnalytics()) return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_location: pageLocation,
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackMatchStart({ gameType, difficulty, gameMode }) {
  trackEvent("level_start", {
    difficulty,
    game_mode: gameMode,
    game_type: gameType,
    level_name: `${gameType}_${gameMode}_${difficulty}`,
  });
}

export function trackMatchEnd({
  averageScore,
  difficulty,
  gameMode,
  gameType,
  rounds,
  totalScore,
}) {
  const levelName = `${gameType}_${gameMode}_${difficulty}`;

  trackEvent("level_end", {
    difficulty,
    game_mode: gameMode,
    game_type: gameType,
    level_name: levelName,
    rounds,
    score_average: averageScore,
    success: true,
  });

  trackEvent("post_score", {
    character: gameType,
    difficulty,
    game_mode: gameMode,
    game_type: gameType,
    level: rounds,
    score: totalScore,
    score_average: averageScore,
  });
}
