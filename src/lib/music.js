"use client";

import { MUSIC_STORAGE_KEY } from "./constants";

export const MUSIC_SCENES = {
  GAME: "game",
  MENU: "menu",
};

const MUSIC_CHANGE_EVENT = "pourcision-music-change";
const MUSIC_ENGINE_KEY = "__pourcisionMusicEngine";
const MUSIC_DISABLED_VALUE = "off";
const MUSIC_ENABLED_VALUE = "on";
const SCREEN_REVEAL_COMPLETE_EVENT = "pourcision-screen-reveal-complete";
const SCREEN_REVEAL_MUSIC_READY_EVENT = "pourcision-screen-reveal-music-ready";
const MASTER_VOLUME = 0.72;
const MUTED_VOLUME = 0.0001;
const LOOKAHEAD_SECONDS = 0.2;
const SCHEDULER_MS = 36;
const AUTO_START_FADE_SECONDS = 1.45;
const QUICK_FADE_SECONDS = 0.08;
const GAME_START_FADE_OUT_SECONDS = 0.62;
const SCENE_FADE_OUT_SECONDS = 0.55;
const SCENE_FADE_IN_SECONDS = 1.05;
const INITIAL_REVEAL_FALLBACK_MS = 9000;
const AUTOPLAY_RETRY_DELAYS_MS = [280, 720, 1400, 2400];

const SCENE_CONFIG = {
  [MUSIC_SCENES.MENU]: {
    bpm: 92,
    loopSteps: 128,
    chords: [
      [57, 64, 69, 76],
      [53, 60, 65, 72],
      [48, 55, 60, 67],
      [55, 62, 67, 74],
      [57, 64, 71, 76],
      [50, 57, 62, 69],
      [52, 59, 64, 71],
      [55, 62, 67, 74],
    ],
  },
  [MUSIC_SCENES.GAME]: {
    bpm: 132,
    loopSteps: 128,
    chords: [
      [45, 52, 57, 64],
      [48, 55, 60, 67],
      [43, 50, 55, 62],
      [40, 47, 52, 59],
      [45, 52, 59, 64],
      [53, 60, 65, 72],
      [50, 57, 62, 69],
      [43, 50, 55, 62],
    ],
  },
};

function getStoredEngine() {
  if (typeof window === "undefined") return null;
  return window[MUSIC_ENGINE_KEY] || null;
}

function storeEngine(nextEngine) {
  if (typeof window === "undefined") return;
  window[MUSIC_ENGINE_KEY] = nextEngine;
}

const storedEngine = getStoredEngine();

let audioContext = storedEngine?.audioContext || null;
let masterGain = storedEngine?.masterGain || null;
let musicBus = storedEngine?.musicBus || null;
let noiseBuffer = storedEngine?.noiseBuffer || null;
let userActivated = Boolean(storedEngine?.userActivated);
let musicEnabled = storedEngine?.musicEnabled ?? true;
let musicPreferenceLoaded = Boolean(storedEngine?.musicPreferenceLoaded);
let currentScene = storedEngine?.currentScene || MUSIC_SCENES.MENU;
let initialRevealComplete = Boolean(storedEngine?.initialRevealComplete);
let didAutoFadeIn = Boolean(storedEngine?.didAutoFadeIn);
let revealFallbackTimerId = null;
let sceneTransitionTimerId = null;
let pendingSceneTransitionTarget = null;
let autoplayRetryTimerId = null;
let autoplayRetryIndex = 0;
let fadeOutStopTimerId = null;
let schedulerId = storedEngine?.schedulerId || null;
let stepIndex = storedEngine?.stepIndex || 0;
let nextStepAt = storedEngine?.nextStepAt || 0;

if (schedulerId && typeof window !== "undefined") {
  window.clearInterval(schedulerId);
  schedulerId = null;
}

if (typeof window !== "undefined") {
  const releaseInitialRevealGate = () => {
    if (initialRevealComplete) return;

    initialRevealComplete = true;
    if (revealFallbackTimerId) {
      window.clearTimeout(revealFallbackTimerId);
      revealFallbackTimerId = null;
    }
    persistEngineState();
    startScheduler({
      smoothAutoFade: true,
    });
  };

  window.addEventListener(SCREEN_REVEAL_COMPLETE_EVENT, releaseInitialRevealGate);
  window.addEventListener(
    SCREEN_REVEAL_MUSIC_READY_EVENT,
    releaseInitialRevealGate,
  );
  revealFallbackTimerId = window.setTimeout(
    releaseInitialRevealGate,
    INITIAL_REVEAL_FALLBACK_MS,
  );
}

function persistEngineState() {
  storeEngine({
    audioContext,
    currentScene,
    didAutoFadeIn,
    initialRevealComplete,
    masterGain,
    musicBus,
    musicEnabled,
    musicPreferenceLoaded,
    nextStepAt,
    noiseBuffer,
    schedulerId,
    stepIndex,
    userActivated,
  });
}

function readStoredMusicPreference() {
  if (typeof window === "undefined") return true;

  const storedPreference = window.localStorage.getItem(MUSIC_STORAGE_KEY);
  return storedPreference !== MUSIC_DISABLED_VALUE;
}

function loadMusicPreference() {
  if (musicPreferenceLoaded) return musicEnabled;

  musicEnabled = readStoredMusicPreference();
  musicPreferenceLoaded = true;
  persistEngineState();
  return musicEnabled;
}

function notifyMusicPreferenceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MUSIC_CHANGE_EVENT));
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function getSceneConfig(scene = currentScene) {
  return SCENE_CONFIG[scene] || SCENE_CONFIG[MUSIC_SCENES.MENU];
}

function getStepSeconds(scene = currentScene) {
  return 60 / getSceneConfig(scene).bpm / 4;
}

function getLoopSteps(scene = currentScene) {
  const config = getSceneConfig(scene);
  return config.loopSteps || config.chords.length * 16 || 64;
}

function normalizeMusicScene(scene) {
  return scene === MUSIC_SCENES.GAME ? MUSIC_SCENES.GAME : MUSIC_SCENES.MENU;
}

function fadeSecondsToMs(seconds) {
  return Math.max(0, Math.round(Number(seconds || 0) * 1000));
}

function clearSceneTransitionTimer() {
  pendingSceneTransitionTarget = null;

  if (!sceneTransitionTimerId || typeof window === "undefined") return;

  window.clearTimeout(sceneTransitionTimerId);
  sceneTransitionTimerId = null;
}

function clearAutoplayRetry() {
  autoplayRetryIndex = 0;

  if (!autoplayRetryTimerId || typeof window === "undefined") return;

  window.clearTimeout(autoplayRetryTimerId);
  autoplayRetryTimerId = null;
}

function clearFadeOutStopTimer() {
  if (!fadeOutStopTimerId || typeof window === "undefined") return;

  window.clearTimeout(fadeOutStopTimerId);
  fadeOutStopTimerId = null;
}

function scheduleAutoplayRetry(options = {}) {
  if (
    typeof window === "undefined" ||
    autoplayRetryTimerId ||
    !initialRevealComplete ||
    !shouldMusicRun() ||
    autoplayRetryIndex >= AUTOPLAY_RETRY_DELAYS_MS.length
  ) {
    return;
  }

  const delay = AUTOPLAY_RETRY_DELAYS_MS[autoplayRetryIndex];
  autoplayRetryIndex += 1;

  autoplayRetryTimerId = window.setTimeout(() => {
    autoplayRetryTimerId = null;
    startScheduler(options);
  }, delay);
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function isDocumentVisible() {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

function shouldMusicRun() {
  return loadMusicPreference() && isDocumentVisible();
}

function resetGraph() {
  audioContext = null;
  masterGain = null;
  musicBus = null;
  noiseBuffer = null;
  stepIndex = 0;
  nextStepAt = 0;
}

function ensureMusicContext() {
  if (typeof window === "undefined") return null;

  if (audioContext?.state === "closed") {
    resetGraph();
    persistEngineState();
  }

  if (!audioContext) {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    audioContext = new AudioContextConstructor();
  }

  if (!musicBus || !masterGain) {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.014;
    compressor.release.value = 0.22;

    masterGain = audioContext.createGain();
    masterGain.gain.value = MUTED_VOLUME;

    compressor.connect(masterGain);
    masterGain.connect(audioContext.destination);
    musicBus = compressor;
  }

  persistEngineState();
  return audioContext;
}

function setMusicGainTarget(targetGain, {
  duration = QUICK_FADE_SECONDS,
  curve = "target",
  fromZero = false,
  immediate = false,
} = {}) {
  if (!audioContext || !masterGain) return;

  const now = audioContext.currentTime;
  const gain = masterGain.gain;
  const startGain = fromZero ? MUTED_VOLUME : gain.value;

  if (!fromZero && typeof gain.cancelAndHoldAtTime === "function") {
    gain.cancelAndHoldAtTime(now);
  } else {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(startGain, now);
  }

  if (immediate) {
    gain.setValueAtTime(targetGain, now);
    return;
  }

  if (curve === "linear") {
    gain.linearRampToValueAtTime(targetGain, now + Math.max(0.01, duration));
    return;
  }

  gain.setTargetAtTime(targetGain, now, duration);
}

function applyMusicGain({
  duration = QUICK_FADE_SECONDS,
  fromZero = false,
  immediate = false,
} = {}) {
  const targetGain = shouldMusicRun() ? MASTER_VOLUME : MUTED_VOLUME;

  setMusicGainTarget(targetGain, {
    duration,
    fromZero,
    immediate,
  });
}

function getNoiseBuffer(context) {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
    return noiseBuffer;
  }

  const length = Math.floor(context.sampleRate * 1.2);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  noiseBuffer = buffer;
  persistEngineState();
  return buffer;
}

function connectMusicNode(context, source, envelope, { filterFrequency, filterType, pan, q }) {
  let current = source;

  if (filterFrequency) {
    const filter = context.createBiquadFilter();
    filter.type = filterType || "lowpass";
    filter.frequency.setValueAtTime(filterFrequency, context.currentTime);
    filter.Q.value = q || 0.7;
    current.connect(filter);
    current = filter;
  }

  if (context.createStereoPanner) {
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(pan || 0, context.currentTime);
    current.connect(panner);
    current = panner;
  }

  current.connect(envelope);
  envelope.connect(musicBus);
}

function scheduleTone(
  context,
  {
    attack = 0.01,
    decay = 0.06,
    detune = 0,
    duration = 0.14,
    filterFrequency = 1800,
    filterType = "lowpass",
    frequency,
    gain = 0.02,
    pan = 0,
    q = 0.8,
    release = 0.14,
    time,
    type = "triangle",
  },
) {
  if (!musicBus || !frequency || time < context.currentTime - 0.02) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const peak = Math.max(0.0001, gain);
  const attackEnd = time + Math.max(0.004, attack);
  const decayEnd = attackEnd + Math.max(0.002, decay);
  const releaseStart = Math.max(decayEnd + 0.002, time + duration);
  const endTime = releaseStart + Math.max(0.02, release);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.detune.setValueAtTime(detune, time);

  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(peak, attackEnd);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.42), decayEnd);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  connectMusicNode(context, oscillator, envelope, {
    filterFrequency,
    filterType,
    pan,
    q,
  });

  oscillator.start(time);
  oscillator.stop(endTime + 0.04);
}

function scheduleNoise(
  context,
  {
    attack = 0.004,
    duration = 0.04,
    filterFrequency = 3400,
    filterType = "highpass",
    gain = 0.006,
    pan = 0,
    q = 0.9,
    release = 0.035,
    time,
  },
) {
  if (!musicBus || time < context.currentTime - 0.02) return;

  const source = context.createBufferSource();
  const envelope = context.createGain();
  const peak = Math.max(0.0001, gain);
  const attackEnd = time + Math.max(0.002, attack);
  const releaseStart = time + duration;
  const endTime = releaseStart + release;

  source.buffer = getNoiseBuffer(context);
  source.loop = true;

  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(peak, attackEnd);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  connectMusicNode(context, source, envelope, {
    filterFrequency,
    filterType,
    pan,
    q,
  });

  source.start(time);
  source.stop(endTime + 0.02);
}

function scheduleKick(context, time) {
  if (!musicBus || time < context.currentTime - 0.02) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const endTime = time + 0.18;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(88, time);
  oscillator.frequency.exponentialRampToValueAtTime(42, endTime);

  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(0.038, time + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(envelope);
  envelope.connect(musicBus);
  oscillator.start(time);
  oscillator.stop(endTime + 0.04);
}

function scheduleMenuStep(context, step, time) {
  const config = getSceneConfig(MUSIC_SCENES.MENU);
  const localStep = step % 16;
  const phraseStep = step % getLoopSteps(MUSIC_SCENES.MENU);
  const bar = Math.floor(phraseStep / 16);
  const chord = config.chords[bar] || config.chords[0];
  const nextChord = config.chords[(bar + 1) % config.chords.length] || chord;

  if (localStep === 0) {
    chord.forEach((midi, index) => {
      scheduleTone(context, {
        attack: 0.08,
        decay: 0.42,
        duration: 1.92,
        filterFrequency: 1250 + index * 130,
        frequency: midiToFrequency(midi),
        gain: 0.0078 - index * 0.0007,
        pan: (index - 1.5) * 0.12,
        release: 0.96,
        time,
        type: index % 2 === 0 ? "sine" : "triangle",
      });
    });
  }

  if (localStep === 0 || localStep === 7 || localStep === 8) {
    scheduleTone(context, {
      attack: 0.018,
      decay: 0.12,
      duration: localStep === 7 ? 0.16 : 0.36,
      filterFrequency: localStep === 7 ? 720 : 560,
      frequency: midiToFrequency(
        localStep === 7 ? nextChord[0] - 12 : chord[0] - 12,
      ),
      gain: localStep === 7 ? 0.009 : 0.017,
      release: 0.22,
      time,
      type: "triangle",
    });
  }

  if (localStep % 2 === 0) {
    const arp = [
      chord[0] + 12,
      chord[1] + 12,
      chord[3] + 7,
      chord[2] + 12,
      chord[1] + 19,
      chord[3] + 12,
      nextChord[1] + 12,
      chord[2] + 7,
    ];
    scheduleTone(context, {
      attack: 0.012,
      decay: 0.07,
      duration: 0.105,
      filterFrequency: localStep % 8 === 0 ? 2600 : 3200,
      frequency: midiToFrequency(arp[(phraseStep / 2) % arp.length]),
      gain: localStep % 8 === 0 ? 0.014 : 0.0105,
      pan: ((phraseStep % 16) - 7.5) / 48,
      release: 0.14,
      time,
      type: "triangle",
    });
  }

  if (localStep === 5 || localStep === 13) {
    const answer = bar % 2 === 0 ? chord[2] + 19 : nextChord[1] + 17;
    scheduleTone(context, {
      attack: 0.02,
      decay: 0.1,
      duration: 0.2,
      filterFrequency: 3800,
      frequency: midiToFrequency(answer),
      gain: 0.0065,
      pan: localStep === 5 ? -0.22 : 0.22,
      release: 0.18,
      time,
      type: "sine",
    });
  }

  if (localStep === 6 || localStep === 10 || localStep === 14) {
    scheduleNoise(context, {
      duration: localStep === 10 ? 0.02 : 0.034,
      filterFrequency: localStep === 10 ? 7000 : 5400,
      gain: localStep === 10 ? 0.0018 : 0.0032,
      pan: localStep < 8 ? -0.08 : 0.08,
      time,
    });
  }
}

function scheduleGameStep(context, step, time) {
  const config = getSceneConfig(MUSIC_SCENES.GAME);
  const localStep = step % 16;
  const phraseStep = step % getLoopSteps(MUSIC_SCENES.GAME);
  const bar = Math.floor(phraseStep / 16);
  const chord = config.chords[bar] || config.chords[0];
  const nextChord = config.chords[(bar + 1) % config.chords.length] || chord;

  if (localStep === 0 || localStep === 8 || (bar % 2 === 1 && localStep === 14)) {
    scheduleKick(context, time);
  }

  if (localStep % 4 === 0 || localStep === 6 || localStep === 14) {
    const bassPattern = [0, 0, 7, 0, 10, 7, 5, 7, 0, 12, 7, 5, 3, 5, 7, 10];
    const bassOffset = bassPattern[Math.floor(phraseStep / 2) % bassPattern.length];
    scheduleTone(context, {
      attack: 0.008,
      decay: 0.055,
      duration: localStep === 6 ? 0.09 : 0.13,
      filterFrequency: localStep === 14 ? 940 : 760,
      frequency: midiToFrequency(
        (localStep === 14 ? nextChord[0] : chord[0]) - 12 + bassOffset,
      ),
      gain: localStep === 6 ? 0.015 : 0.024,
      release: 0.12,
      time,
      type: "sawtooth",
    });
  }

  if (localStep % 2 === 1) {
    const arp = [
      chord[0] + 12,
      chord[1] + 12,
      chord[2] + 12,
      chord[3] + 7,
      chord[1] + 19,
      chord[2] + 17,
      nextChord[1] + 12,
      chord[0] + 24,
    ];
    scheduleTone(context, {
      attack: 0.006,
      decay: 0.04,
      detune: localStep % 4 === 1 ? -3 : 3,
      duration: localStep === 15 ? 0.05 : 0.068,
      filterFrequency: localStep === 15 ? 3400 : 2850,
      frequency: midiToFrequency(arp[Math.floor(phraseStep / 2) % arp.length]),
      gain: localStep === 15 ? 0.007 : 0.0105,
      pan: localStep % 4 === 1 ? -0.18 : 0.18,
      q: 1.1,
      release: 0.08,
      time,
      type: "square",
    });
  }

  if (localStep === 4 || localStep === 12) {
    chord.slice(1).forEach((midi, index) => {
      scheduleTone(context, {
        attack: 0.008,
        decay: 0.045,
        duration: 0.09,
        filterFrequency: 1550 + index * 210,
        frequency: midiToFrequency(midi + 12),
        gain: 0.0065 - index * 0.0006,
        pan: (index - 1) * 0.1,
        release: 0.1,
        time,
        type: "triangle",
      });
    });
  }

  if (localStep === 7 && bar % 2 === 0) {
    scheduleTone(context, {
      attack: 0.012,
      decay: 0.07,
      duration: 0.14,
      filterFrequency: 4200,
      frequency: midiToFrequency(nextChord[2] + 19),
      gain: 0.006,
      pan: 0.24,
      release: 0.12,
      time,
      type: "sine",
    });
  }

  if (localStep === 2 || localStep === 6 || localStep === 10 || localStep === 14 || localStep === 15) {
    scheduleNoise(context, {
      duration: localStep === 15 ? 0.018 : 0.028,
      filterFrequency: localStep === 15 ? 7600 : 6200,
      gain: localStep === 15 ? 0.0022 : 0.0048,
      pan: localStep < 8 ? -0.1 : 0.1,
      time,
    });
  }
}

function scheduleSceneStep(context, scene, step, time) {
  if (scene === MUSIC_SCENES.GAME) {
    scheduleGameStep(context, step, time);
    return;
  }

  scheduleMenuStep(context, step, time);
}

function stopScheduler({ fade = true } = {}) {
  clearFadeOutStopTimer();

  if (schedulerId && typeof window !== "undefined") {
    window.clearInterval(schedulerId);
  }

  schedulerId = null;
  if (fade) applyMusicGain();
  persistEngineState();
}

function runScheduler() {
  if (!shouldMusicRun()) {
    stopScheduler();
    return;
  }

  const context = ensureMusicContext();
  if (!context || context.state !== "running") return;

  const stepSeconds = getStepSeconds(currentScene);
  const loopSteps = getLoopSteps(currentScene);

  if (!nextStepAt || nextStepAt < context.currentTime - stepSeconds) {
    nextStepAt = context.currentTime + 0.04;
  }

  while (nextStepAt < context.currentTime + LOOKAHEAD_SECONDS) {
    scheduleSceneStep(context, currentScene, stepIndex, nextStepAt);
    nextStepAt += stepSeconds;
    stepIndex = (stepIndex + 1) % loopSteps;
  }

  persistEngineState();
}

function shouldDeferInitialMusicStart(deferUntilReveal) {
  return Boolean(deferUntilReveal) && !initialRevealComplete;
}

function startScheduler({
  deferUntilReveal = false,
  fadeInDuration = null,
  fadeInFromZero = false,
  reset = false,
  smoothAutoFade = false,
} = {}) {
  if (!shouldMusicRun()) return;
  if (shouldDeferInitialMusicStart(deferUntilReveal)) return;

  clearFadeOutStopTimer();
  const context = ensureMusicContext();
  if (!context) return;

  if (context.state === "suspended") {
    const retryOptions = {
      deferUntilReveal,
      fadeInDuration,
      fadeInFromZero,
      reset,
      smoothAutoFade,
    };

    context
      .resume()
      .then(() => {
        clearAutoplayRetry();
        userActivated = true;
        persistEngineState();
        startScheduler(retryOptions);
      })
      .catch(() => {
        scheduleAutoplayRetry(retryOptions);
      });
    scheduleAutoplayRetry(retryOptions);
    return;
  }

  if (context.state !== "running") return;

  clearAutoplayRetry();
  userActivated = true;

  if (reset || !nextStepAt) {
    stepIndex = 0;
    nextStepAt = context.currentTime + 0.06;
  }

  const gainOptions = smoothAutoFade
    ? { duration: AUTO_START_FADE_SECONDS, fromZero: !didAutoFadeIn }
    : fadeInDuration
      ? { duration: fadeInDuration, fromZero: fadeInFromZero }
      : undefined;

  applyMusicGain(gainOptions);

  if (smoothAutoFade) {
    didAutoFadeIn = true;
  }

  if (!schedulerId) {
    schedulerId = window.setInterval(runScheduler, SCHEDULER_MS);
    runScheduler();
  }

  persistEngineState();
}

export function prepareMusic() {
  loadMusicPreference();

  if (!musicEnabled) return;
  startScheduler({
    deferUntilReveal: true,
    smoothAutoFade: true,
  });
}

export function unlockMusic() {
  userActivated = true;
  persistEngineState();

  if (!loadMusicPreference()) return;
  startScheduler({
    deferUntilReveal: true,
    smoothAutoFade: true,
  });
}

export function resumeMusicIfAllowed() {
  if (!loadMusicPreference()) return;
  startScheduler();
}

export function pauseMusic() {
  stopScheduler();
}

export function fadeOutMusic({
  curve = "target",
  duration = GAME_START_FADE_OUT_SECONDS,
  keepSchedulerDuringFade = false,
} = {}) {
  clearSceneTransitionTimer();
  clearFadeOutStopTimer();

  if (!loadMusicPreference()) {
    stopScheduler({ fade: false });
    return Promise.resolve();
  }

  if (!audioContext || !masterGain) {
    stopScheduler({ fade: false });
    return Promise.resolve();
  }

  if (!keepSchedulerDuringFade) {
    stopScheduler({ fade: false });
  }
  setMusicGainTarget(MUTED_VOLUME, { curve, duration });

  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const finishDelay = fadeSecondsToMs(duration) + 90;

    if (keepSchedulerDuringFade) {
      fadeOutStopTimerId = window.setTimeout(() => {
        fadeOutStopTimerId = null;
        stopScheduler({ fade: false });
        resolve();
      }, finishDelay);
      return;
    }

    window.setTimeout(resolve, finishDelay);
  });
}

export function startMusicScene(scene, {
  deferUntilReveal = false,
  duration = SCENE_FADE_IN_SECONDS,
  fromZero = true,
  reset = true,
} = {}) {
  clearSceneTransitionTimer();

  const nextScene = normalizeMusicScene(scene);
  const sceneChanged = currentScene !== nextScene;

  if (sceneChanged) {
    currentScene = nextScene;
  }

  if (reset || sceneChanged) {
    stepIndex = 0;
    nextStepAt = audioContext ? audioContext.currentTime + 0.08 : 0;
  }

  persistEngineState();

  if (!loadMusicPreference()) return;

  startScheduler({
    deferUntilReveal,
    fadeInDuration: duration,
    fadeInFromZero: fromZero,
    reset,
  });
}

export function transitionMusicToScene(scene, {
  fadeIn = SCENE_FADE_IN_SECONDS,
  fadeOut = SCENE_FADE_OUT_SECONDS,
  reset = true,
} = {}) {
  const nextScene = normalizeMusicScene(scene);

  clearSceneTransitionTimer();
  pendingSceneTransitionTarget = nextScene;

  if (!loadMusicPreference()) {
    pendingSceneTransitionTarget = null;
    currentScene = nextScene;
    stepIndex = 0;
    nextStepAt = audioContext ? audioContext.currentTime + 0.08 : 0;
    persistEngineState();
    return Promise.resolve();
  }

  if (currentScene === nextScene) {
    pendingSceneTransitionTarget = null;
    startMusicScene(nextScene, {
      duration: fadeIn,
      fromZero: false,
      reset: false,
    });
    return Promise.resolve();
  }

  if (!audioContext || !masterGain || !schedulerId) {
    pendingSceneTransitionTarget = null;
    startMusicScene(nextScene, {
      deferUntilReveal: true,
      duration: fadeIn,
      fromZero: true,
      reset,
    });
    return Promise.resolve();
  }

  stopScheduler({ fade: false });
  setMusicGainTarget(MUTED_VOLUME, { duration: fadeOut });

  if (typeof window === "undefined") {
    startMusicScene(nextScene, {
      duration: fadeIn,
      fromZero: true,
      reset,
    });
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    sceneTransitionTimerId = window.setTimeout(() => {
      sceneTransitionTimerId = null;
      pendingSceneTransitionTarget = null;
      startMusicScene(nextScene, {
        duration: fadeIn,
        fromZero: true,
        reset,
      });
      resolve();
    }, fadeSecondsToMs(fadeOut) + 120);
  });
}

export function setMusicScene(scene) {
  const nextScene = normalizeMusicScene(scene);

  if (pendingSceneTransitionTarget === nextScene) {
    return;
  }

  if (
    currentScene !== nextScene &&
    schedulerId &&
    initialRevealComplete &&
    loadMusicPreference()
  ) {
    transitionMusicToScene(nextScene);
    return;
  }

  if (currentScene !== nextScene) {
    currentScene = nextScene;
    stepIndex = 0;
    nextStepAt = audioContext ? audioContext.currentTime + 0.08 : 0;
  }

  persistEngineState();

  if (loadMusicPreference()) {
    startScheduler({
      deferUntilReveal: true,
      reset: false,
      smoothAutoFade: true,
    });
  }
}

export function getMusicEnabledSnapshot() {
  return loadMusicPreference();
}

export function setMusicEnabled(enabled) {
  musicEnabled = Boolean(enabled);
  musicPreferenceLoaded = true;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      MUSIC_STORAGE_KEY,
      musicEnabled ? MUSIC_ENABLED_VALUE : MUSIC_DISABLED_VALUE,
    );
  }

  if (musicEnabled) {
    userActivated = true;
    startScheduler();
  } else {
    stopScheduler();
  }

  applyMusicGain();
  notifyMusicPreferenceChange();
  persistEngineState();
}

export function subscribeToMusicPreference(callback) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event) => {
    if (event.key !== MUSIC_STORAGE_KEY) return;

    musicEnabled = event.newValue !== MUSIC_DISABLED_VALUE;
    musicPreferenceLoaded = true;

    if (musicEnabled) {
      resumeMusicIfAllowed();
    } else {
      stopScheduler();
    }

    applyMusicGain();
    persistEngineState();
    callback();
  };

  const handleLocalChange = () => {
    loadMusicPreference();
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(MUSIC_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(MUSIC_CHANGE_EVENT, handleLocalChange);
  };
}
