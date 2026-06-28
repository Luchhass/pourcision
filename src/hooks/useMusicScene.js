"use client";

import { useEffect } from "react";
import { MUSIC_SCENES, setMusicScene } from "@/lib/music";

export { MUSIC_SCENES };

export function useMusicScene(scene = MUSIC_SCENES.MENU) {
  useEffect(() => {
    if (!scene) return;

    setMusicScene(scene);
  }, [scene]);
}
