"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_WATER_COLORS, WATER_COLORS } from "@/lib/constants";
import {
  PREMIUM_WATER_COLORS_REWARD,
  hasRedeemedReward,
  redeemSessionCode,
  subscribeRedeemCodes,
} from "@/lib/redeemCodes";

export function useRedeemCodes() {
  const [hasPremiumWaterColors, setHasPremiumWaterColors] = useState(false);

  useEffect(() => {
    const refreshRedeems = () => {
      setHasPremiumWaterColors(
        hasRedeemedReward(PREMIUM_WATER_COLORS_REWARD),
      );
    };

    refreshRedeems();
    return subscribeRedeemCodes(refreshRedeems);
  }, []);

  const redeemCode = useCallback((code) => {
    const result = redeemSessionCode(code);
    if (result.ok && result.reward === PREMIUM_WATER_COLORS_REWARD) {
      setHasPremiumWaterColors(true);
    }
    return result;
  }, []);

  const visibleWaterColors = useMemo(
    () => (hasPremiumWaterColors ? WATER_COLORS : DEFAULT_WATER_COLORS),
    [hasPremiumWaterColors],
  );

  return {
    hasPremiumWaterColors,
    redeemCode,
    visibleWaterColors,
  };
}
