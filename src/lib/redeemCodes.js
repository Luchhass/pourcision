export const REDEEM_CODES_EVENT = "pourcision-redeem-codes-change";
export const REDEEM_CODES_STORAGE_KEY = "pourcision-redeem-codes";
export const PREMIUM_WATER_COLORS_REWARD = "premium-water-colors";

const CODE_REWARDS = {
  gradiant: PREMIUM_WATER_COLORS_REWARD,
};

export function normalizeRedeemCode(value) {
  return String(value || "").trim().toLowerCase();
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && window.sessionStorage;
}

export function readRedeemedRewards() {
  if (!canUseSessionStorage()) return [];

  try {
    const storedRewards = window.sessionStorage.getItem(REDEEM_CODES_STORAGE_KEY);
    const parsedRewards = JSON.parse(storedRewards || "[]");
    return Array.isArray(parsedRewards) ? parsedRewards : [];
  } catch {
    return [];
  }
}

export function hasRedeemedReward(reward) {
  return readRedeemedRewards().includes(reward);
}

export function redeemSessionCode(code) {
  const reward = CODE_REWARDS[normalizeRedeemCode(code)];
  if (!reward || !canUseSessionStorage()) {
    return { ok: false, reward: null };
  }

  const rewards = new Set(readRedeemedRewards());
  rewards.add(reward);

  try {
    window.sessionStorage.setItem(
      REDEEM_CODES_STORAGE_KEY,
      JSON.stringify([...rewards]),
    );
    window.dispatchEvent(
      new CustomEvent(REDEEM_CODES_EVENT, { detail: { reward } }),
    );
  } catch {
    return { ok: false, reward: null };
  }

  return { ok: true, reward };
}

export function subscribeRedeemCodes(callback) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event) => {
    if (event.key === REDEEM_CODES_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(REDEEM_CODES_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(REDEEM_CODES_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
