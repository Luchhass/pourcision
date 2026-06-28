"use client";

import { SOUND_STORAGE_KEY } from "./constants";

const MASTER_VOLUME = 0.86;
const MUTED_VOLUME = 0.0001;
const SOUND_CHANGE_EVENT = "pourcision-sound-change";
const AUDIO_ENGINE_KEY = "__pourcisionAudioEngine";

function getStoredEngine() {
  if (typeof window === "undefined") return null;
  return window[AUDIO_ENGINE_KEY] || null;
}

function storeEngine(nextEngine) {
  if (typeof window === "undefined") return;
  window[AUDIO_ENGINE_KEY] = nextEngine;
}

const storedEngine = getStoredEngine();

let audioContext = storedEngine?.audioContext || null;
let masterGain = storedEngine?.masterGain || null;
let mixBus = storedEngine?.mixBus || null;
let noiseBuffer = storedEngine?.noiseBuffer || null;
let userActivated = Boolean(storedEngine?.userActivated);
let soundEnabled = storedEngine?.soundEnabled ?? true;
let soundPreferenceLoaded = Boolean(storedEngine?.soundPreferenceLoaded);
let didPrimeGraph = Boolean(storedEngine?.didPrimeGraph);
let activePourLoops = storedEngine?.activePourLoops || new Set();

const lastPlayedAt = new Map();

function persistEngineState() {
  storeEngine({
    activePourLoops,
    audioContext,
    didPrimeGraph,
    masterGain,
    mixBus,
    noiseBuffer,
    soundEnabled,
    soundPreferenceLoaded,
    userActivated,
  });
}

function stopActivePourLoops({ level = 0, release = false } = {}) {
  const loops = Array.from(activePourLoops);

  loops.forEach((loop) => {
    loop.stop({ level, release });
  });
  activePourLoops.clear();
  persistEngineState();
}

function registerPourLoop(loop) {
  activePourLoops.add(loop);
  persistEngineState();

  return () => {
    activePourLoops.delete(loop);
    persistEngineState();
  };
}

if (storedEngine?.activePourLoops?.size) {
  stopActivePourLoops({ release: false });
}

function readStoredSoundPreference() {
  if (typeof window === "undefined") return true;

  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
}

function loadSoundPreference() {
  if (soundPreferenceLoaded) return soundEnabled;

  soundEnabled = readStoredSoundPreference();
  soundPreferenceLoaded = true;
  persistEngineState();
  return soundEnabled;
}

function notifySoundPreferenceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SOUND_CHANGE_EVENT));
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function applyMasterGain({ immediate = false } = {}) {
  if (!audioContext || !masterGain) return;

  const targetGain = loadSoundPreference() ? MASTER_VOLUME : MUTED_VOLUME;
  const gain = masterGain.gain;
  const now = audioContext.currentTime;

  gain.cancelScheduledValues(now);

  if (immediate) {
    gain.setValueAtTime(targetGain, now);
    return;
  }

  gain.setTargetAtTime(targetGain, now, 0.014);
}

function ensureAudioContext() {
  if (typeof window === "undefined") return null;

  if (audioContext?.state === "closed") {
    audioContext = null;
    masterGain = null;
    mixBus = null;
    noiseBuffer = null;
    didPrimeGraph = false;
    activePourLoops.clear();
    persistEngineState();
  }

  if (!audioContext) {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    audioContext = new AudioContextConstructor();

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    masterGain = audioContext.createGain();
    masterGain.gain.value = loadSoundPreference()
      ? MASTER_VOLUME
      : MUTED_VOLUME;

    compressor.connect(masterGain);
    masterGain.connect(audioContext.destination);
    mixBus = compressor;
    didPrimeGraph = false;
    audioContext.addEventListener?.("statechange", () => {
      if (audioContext?.state === "running") {
        applyMasterGain();
        primeAudioGraph();
      }
    });
  }

  applyMasterGain({ immediate: true });
  persistEngineState();
  return audioContext;
}

function isSoundEnabled() {
  return loadSoundPreference();
}

function getPlayableContext() {
  if (!isSoundEnabled()) return null;

  const context = ensureAudioContext();
  if (!context) return null;

  if (context.state === "suspended") {
    context
      .resume()
      .then(() => {
        userActivated = true;
        primeAudioGraph();
        persistEngineState();
      })
      .catch(() => {});

    return userActivated ? context : null;
  }

  return context;
}

function getNowMs() {
  if (typeof performance === "undefined") return Date.now();
  return performance.now();
}

function allowSound(key, spacingMs) {
  const now = getNowMs();
  const previous = lastPlayedAt.get(key) || 0;

  if (now - previous < spacingMs) return false;

  lastPlayedAt.set(key, now);
  return true;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function getNoiseBuffer(context) {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
    return noiseBuffer;
  }

  const length = Math.floor(context.sampleRate * 1.8);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    brown = brown * 0.72 + white * 0.28;
    data[index] = brown;
  }

  noiseBuffer = buffer;
  persistEngineState();
  return buffer;
}

function primeAudioGraph() {
  const context = audioContext;
  if (!context || !mixBus || didPrimeGraph || !isSoundEnabled()) return;

  didPrimeGraph = true;
  persistEngineState();

  const startTime = context.currentTime + 0.001;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(160, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime + 0.018);

  oscillator.connect(envelope);
  envelope.connect(mixBus);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.024);
}

function connectWithPan(context, source, destination, pan) {
  if (typeof context.createStereoPanner !== "function" || pan === 0) {
    source.connect(destination);
    return;
  }

  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  source.connect(panner);
  panner.connect(destination);
}

function scheduleTone(
  context,
  {
    attack = 0.006,
    delay = 0,
    duration = 0.1,
    endFrequency,
    frequency,
    gain = 0.04,
    pan = 0,
    type = "sine",
  },
) {
  if (!mixBus) return;

  const startTime = context.currentTime + delay;
  const endTime = startTime + duration;
  const attackTime = Math.min(attack, duration * 0.45);
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(1, frequency), startTime);

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      endTime,
    );
  }

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.linearRampToValueAtTime(gain, startTime + attackTime);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(envelope);
  connectWithPan(context, envelope, mixBus, pan);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.04);
}

function scheduleNoise(
  context,
  {
    delay = 0,
    duration = 0.03,
    filterFrequency = 1800,
    filterType = "bandpass",
    gain = 0.03,
    pan = 0,
    q = 5,
  } = {},
) {
  if (!mixBus) return;

  const startTime = context.currentTime + delay;
  const endTime = startTime + duration;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const buffer = getNoiseBuffer(context);
  const offsetLimit = Math.max(0, buffer.duration - duration - 0.02);

  source.buffer = buffer;
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, startTime);
  filter.Q.value = q;

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.linearRampToValueAtTime(
    gain,
    startTime + Math.min(0.004, duration * 0.45),
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  source.connect(filter);
  filter.connect(envelope);
  connectWithPan(context, envelope, mixBus, pan);
  source.start(startTime, Math.random() * offsetLimit, duration);
  source.stop(endTime + 0.02);
}

function scheduleBubble(
  context,
  {
    delay = 0,
    duration = 0.075,
    frequency = 420,
    gain = 0.035,
    pan = 0,
    rise = 1.42,
  } = {},
) {
  scheduleTone(context, {
    attack: 0.006,
    delay,
    duration,
    endFrequency: frequency * rise,
    frequency,
    gain,
    pan,
    type: "sine",
  });
  scheduleNoise(context, {
    delay,
    duration: Math.min(0.032, duration * 0.5),
    filterFrequency: frequency * 2.15,
    filterType: "bandpass",
    gain: gain * 0.34,
    pan,
    q: 8,
  });
}

function scheduleSplash(
  context,
  {
    brightness = 1,
    delay = 0,
    pan = 0,
    size = 1,
  } = {},
) {
  scheduleNoise(context, {
    delay,
    duration: 0.045 + size * 0.045,
    filterFrequency: 780 + brightness * 700,
    filterType: "bandpass",
    gain: 0.025 * size,
    pan,
    q: 2.4,
  });
  scheduleNoise(context, {
    delay: delay + 0.012,
    duration: 0.028 + size * 0.018,
    filterFrequency: 2600 + brightness * 1800,
    filterType: "highpass",
    gain: 0.011 * size,
    pan: pan * 0.7,
    q: 1.2,
  });
}

export function prepareAudio() {
  if (!isSoundEnabled()) return;

  const context = ensureAudioContext();
  if (!context) return;

  getNoiseBuffer(context);

  if (context.state === "suspended") {
    context
      .resume()
      .then(() => {
        userActivated = true;
        primeAudioGraph();
        persistEngineState();
      })
      .catch(() => {});
    return;
  }

  if (context.state === "running") {
    userActivated = true;
    primeAudioGraph();
    persistEngineState();
  }
}

export function unlockAudio() {
  userActivated = true;
  persistEngineState();

  const context = ensureAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context
      .resume()
      .then(primeAudioGraph)
      .catch(() => {});
    return;
  }

  primeAudioGraph();
}

export function resumeAudioIfAllowed() {
  if (!isSoundEnabled()) return;

  const context = ensureAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context
      .resume()
      .then(() => {
        userActivated = true;
        primeAudioGraph();
        persistEngineState();
      })
      .catch(() => {});
    return;
  }

  userActivated = true;
  applyMasterGain();
  persistEngineState();
}

export function stopPourAudio({ level = 0, release = false } = {}) {
  stopActivePourLoops({ level, release });
}

export function getSoundEnabledSnapshot() {
  return isSoundEnabled();
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  soundPreferenceLoaded = true;
  persistEngineState();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? "on" : "off");
  }

  applyMasterGain();
  notifySoundPreferenceChange();

  if (soundEnabled) {
    unlockAudio();
    window.setTimeout(playSoundEnabled, 24);
  }
}

export function subscribeToSoundPreference(callback) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event) => {
    if (event.key !== SOUND_STORAGE_KEY) return;

    soundEnabled = event.newValue !== "off";
    soundPreferenceLoaded = true;
    persistEngineState();
    applyMasterGain();
    callback();
  };

  const handleLocalChange = () => {
    loadSoundPreference();
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SOUND_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SOUND_CHANGE_EVENT, handleLocalChange);
  };
}

export function playButtonHover() {
  const context = getPlayableContext();
  if (!context || !allowSound("button-hover", 58)) return;

  scheduleBubble(context, {
    duration: 0.06,
    frequency: 430,
    gain: 0.021,
    rise: 1.28,
  });
  scheduleSplash(context, {
    brightness: 0.8,
    delay: 0.01,
    size: 0.55,
  });
}

export function playButtonClick() {
  const context = getPlayableContext();
  if (!context || !allowSound("button-click", 36)) return;

  scheduleSplash(context, {
    brightness: 1.05,
    size: 1.25,
  });
  scheduleTone(context, {
    attack: 0.003,
    duration: 0.105,
    endFrequency: 128,
    frequency: 210,
    gain: 0.062,
    type: "sine",
  });
  scheduleBubble(context, {
    delay: 0.035,
    duration: 0.075,
    frequency: 520,
    gain: 0.034,
    rise: 1.34,
  });
}

export function playCloseHover() {
  const context = getPlayableContext();
  if (!context || !allowSound("close-hover", 70)) return;

  scheduleBubble(context, {
    duration: 0.075,
    frequency: 560,
    gain: 0.026,
    rise: 0.64,
  });
}

export function playCloseClick() {
  const context = getPlayableContext();
  if (!context || !allowSound("close-click", 52)) return;

  scheduleSplash(context, {
    brightness: 0.55,
    size: 1.1,
  });
  scheduleTone(context, {
    attack: 0.002,
    duration: 0.17,
    endFrequency: 64,
    frequency: 260,
    gain: 0.062,
    type: "triangle",
  });
  scheduleNoise(context, {
    delay: 0.025,
    duration: 0.08,
    filterFrequency: 420,
    filterType: "lowpass",
    gain: 0.028,
    q: 1.6,
  });
}

export function playDifficultyHover(index = 1) {
  const context = getPlayableContext();
  if (!context || !allowSound("difficulty-hover", 55)) return;

  const base = 330 + index * 80;
  scheduleBubble(context, {
    duration: 0.055,
    frequency: base,
    gain: 0.024,
    pan: (index - 1) * 0.06,
    rise: 1.2,
  });
}

export function playGameModeHover(index = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound("game-mode-hover", 55)) return;

  const base = 360 + index * 34;
  const pan = (index - 2) * 0.035;
  scheduleSplash(context, {
    brightness: 0.65 + index * 0.08,
    pan,
    size: 0.48,
  });
  scheduleTone(context, {
    attack: 0.006,
    duration: 0.07,
    endFrequency: base * 1.18,
    frequency: base,
    gain: 0.022,
    pan,
    type: "sine",
  });
}

export function playWaterColorHover(index = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound("water-color-hover", 45)) return;

  scheduleBubble(context, {
    duration: 0.045,
    frequency: 520 + (index % 8) * 36,
    gain: 0.018,
    pan: ((index % 5) - 2) * 0.035,
    rise: 1.16,
  });
}

export function playDifficultySelect(difficultyId = "normal", index = 1) {
  const context = getPlayableContext();
  if (!context || !allowSound(`difficulty-select-${difficultyId}`, 120)) return;

  const presets = {
    easy: { base: 560, body: 178, brightness: 1.3, gain: 0.046 },
    normal: { base: 430, body: 132, brightness: 0.95, gain: 0.058 },
    hard: { base: 310, body: 88, brightness: 0.66, gain: 0.066 },
  };
  const preset = presets[difficultyId] || presets.normal;
  const pan = (index - 1) * 0.05;

  scheduleSplash(context, {
    brightness: preset.brightness,
    pan,
    size: 1.15,
  });
  scheduleTone(context, {
    attack: 0.003,
    duration: 0.16,
    endFrequency: preset.body,
    frequency: preset.base,
    gain: preset.gain,
    pan,
    type: "sine",
  });
  scheduleBubble(context, {
    delay: 0.065,
    duration: 0.075,
    frequency: preset.base * 0.82,
    gain: 0.024,
    pan,
    rise: 1.5,
  });
}

export function playGameModeSelect(gameModeId = "classic", index = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound(`game-mode-select-${gameModeId}`, 110)) return;

  const modePreset = {
    blind: { brightness: 0.92, root: 310, rise: 0.95 },
    flash: { brightness: 1.22, root: 430, rise: 1.7 },
    classic: { brightness: 0.95, root: 360, rise: 1.42 },
    "fake-target": { brightness: 1.35, root: 470, rise: 1.26 },
    invert: { brightness: 1.05, root: 330, rise: 0.82 },
    leaky: { brightness: 0.58, root: 250, rise: 0.82 },
    "reverse-pour": { brightness: 0.7, root: 300, rise: 0.7 },
    "charge-pour": { brightness: 1.05, root: 390, rise: 1.9 },
    colorblind: { brightness: 0.82, root: 280, rise: 1.15 },
    "auto-rise": { brightness: 1.18, root: 450, rise: 1.6 },
    tilt: { brightness: 1.1, root: 520, rise: 1.08 },
  }[gameModeId] || { brightness: 0.95, root: 360, rise: 1.35 };
  const pan = (index - 2) * 0.04;

  scheduleSplash(context, {
    brightness: modePreset.brightness,
    pan,
    size: gameModeId === "leaky" ? 1.35 : 1.05,
  });
  scheduleBubble(context, {
    delay: 0.018,
    duration: 0.12,
    frequency: modePreset.root + index * 18,
    gain: 0.045,
    pan,
    rise: modePreset.rise,
  });
  if (gameModeId === "leaky") {
    scheduleNoise(context, {
      delay: 0.05,
      duration: 0.08,
      filterFrequency: 580,
      filterType: "bandpass",
      gain: 0.034,
      pan,
      q: 3.4,
    });
  }
}

export function playWaterColorSelect(index = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound(`water-color-select-${index}`, 85)) return;

  const base = 430 + (index % 9) * 34;
  const pan = ((index % 7) - 3) * 0.035;
  scheduleSplash(context, {
    brightness: 0.85 + (index % 5) * 0.12,
    pan,
    size: 1,
  });
  scheduleBubble(context, {
    delay: 0.026,
    duration: 0.105,
    frequency: base,
    gain: 0.04,
    pan,
    rise: 1.52,
  });
  scheduleBubble(context, {
    delay: 0.085,
    duration: 0.07,
    frequency: base * 1.32,
    gain: 0.022,
    pan: -pan,
    rise: 1.18,
  });
}

export function playIntroStep(stepIndex = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound(`intro-step-${stepIndex}`, 250)) return;

  const baseFrequency = [440, 540, 680][stepIndex] || 680;

  if (stepIndex === 2) {
    scheduleNoise(context, {
      duration: 0.055,
      filterFrequency: 980,
      filterType: "bandpass",
      gain: 0.052,
      q: 4.6,
    });
    scheduleTone(context, {
      attack: 0.002,
      duration: 0.13,
      endFrequency: baseFrequency * 1.14,
      frequency: baseFrequency,
      gain: 0.078,
      type: "square",
    });
    scheduleTone(context, {
      attack: 0.004,
      delay: 0.018,
      duration: 0.11,
      endFrequency: 230,
      frequency: 180,
      gain: 0.045,
      type: "sine",
    });
    scheduleTone(context, {
      attack: 0.005,
      delay: 0.04,
      duration: 0.09,
      endFrequency: baseFrequency * 1.62,
      frequency: baseFrequency * 1.22,
      gain: 0.036,
      type: "triangle",
    });
    scheduleNoise(context, {
      delay: 0.035,
      duration: 0.07,
      filterFrequency: 1850,
      filterType: "bandpass",
      gain: 0.026,
      q: 3.1,
    });
    return;
  }

  scheduleNoise(context, {
    duration: 0.032,
    filterFrequency: 780 + stepIndex * 170,
    filterType: "bandpass",
    gain: 0.03,
    q: 6,
  });
  scheduleTone(context, {
    attack: 0.002,
    duration: 0.13,
    endFrequency: baseFrequency * 1.08,
    frequency: baseFrequency,
    gain: 0.066,
    type: "square",
  });
  scheduleTone(context, {
    attack: 0.004,
    delay: 0.035,
    duration: 0.08,
    endFrequency: baseFrequency * 1.38,
    frequency: baseFrequency * 0.86,
    gain: 0.026,
    type: "sine",
  });
}

export function startChargeLoop() {
  const context = getPlayableContext();
  if (!context || !mixBus) return { stop: () => {}, update: () => {} };

  stopActivePourLoops({ release: false });

  const startTime = context.currentTime;
  const reservoir = context.createBufferSource();
  const reservoirFilter = context.createBiquadFilter();
  const reservoirGain = context.createGain();
  const hum = context.createOscillator();
  const shimmer = context.createOscillator();
  const humGain = context.createGain();
  const shimmerGain = context.createGain();
  const filter = context.createBiquadFilter();
  const timers = new Set();
  let pressure = 0;
  let stopped = false;

  reservoir.buffer = getNoiseBuffer(context);
  reservoir.loop = true;
  reservoirFilter.type = "lowpass";
  reservoirFilter.frequency.setValueAtTime(520, startTime);
  reservoirFilter.Q.value = 0.18;
  reservoirGain.gain.setValueAtTime(0.0001, startTime);
  reservoirGain.gain.linearRampToValueAtTime(0.0016, startTime + 0.18);

  hum.type = "sawtooth";
  shimmer.type = "triangle";
  hum.frequency.setValueAtTime(132, startTime);
  shimmer.frequency.setValueAtTime(420, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, startTime);
  filter.Q.value = 0.72;
  humGain.gain.setValueAtTime(0.0001, startTime);
  shimmerGain.gain.setValueAtTime(0.0001, startTime);
  humGain.gain.linearRampToValueAtTime(0.006, startTime + 0.16);
  shimmerGain.gain.linearRampToValueAtTime(0.0028, startTime + 0.2);

  reservoir.connect(reservoirFilter);
  reservoirFilter.connect(reservoirGain);
  reservoirGain.connect(mixBus);
  hum.connect(filter);
  filter.connect(humGain);
  shimmer.connect(shimmerGain);
  humGain.connect(mixBus);
  shimmerGain.connect(mixBus);
  reservoir.start(startTime);
  hum.start(startTime);
  shimmer.start(startTime);

  const tick = () => {
    if (stopped) return;

    const pulseBase = 460 + pressure * 540;
    const pulsePan = (Math.random() - 0.5) * 0.16;

    scheduleTone(context, {
      attack: 0.003,
      duration: 0.055 + pressure * 0.02,
      endFrequency: pulseBase * (1.22 + pressure * 0.16),
      frequency: pulseBase,
      gain: 0.008 + pressure * 0.016,
      pan: pulsePan,
      type: "triangle",
    });
    if (pressure > 0.32) {
      scheduleTone(context, {
        attack: 0.002,
        delay: 0.018,
        duration: 0.04 + pressure * 0.012,
        endFrequency: pulseBase * (2.05 + pressure * 0.18),
        frequency: pulseBase * 1.48,
        gain: 0.004 + pressure * 0.01,
        pan: -pulsePan * 0.65,
        type: "square",
      });
    }

    const timerId = window.setTimeout(tick, 168 - pressure * 54);
    timers.add(timerId);
  };

  const timerId = window.setTimeout(tick, 120);
  timers.add(timerId);

  let unregister = () => {};
  const loop = {
    update(nextPressure = pressure) {
      if (stopped) return;

      pressure = clamp01(nextPressure);
      const now = context.currentTime;
      reservoirFilter.frequency.setTargetAtTime(520 + pressure * 460, now, 0.08);
      reservoirGain.gain.setTargetAtTime(0.001 + pressure * 0.003, now, 0.08);
      hum.frequency.setTargetAtTime(132 + pressure * 192, now, 0.08);
      shimmer.frequency.setTargetAtTime(420 + pressure * 760, now, 0.08);
      filter.frequency.setTargetAtTime(900 + pressure * 2100, now, 0.08);
      humGain.gain.setTargetAtTime(0.006 + pressure * 0.026, now, 0.08);
      shimmerGain.gain.setTargetAtTime(0.0028 + pressure * 0.018, now, 0.08);
    },
    stop({ release = false } = {}) {
      if (stopped) return;

      stopped = true;
      unregister();
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();

      const now = context.currentTime;
      reservoirGain.gain.cancelScheduledValues(now);
      humGain.gain.cancelScheduledValues(now);
      shimmerGain.gain.cancelScheduledValues(now);
      reservoirGain.gain.setTargetAtTime(0.0001, now, 0.05);
      humGain.gain.setTargetAtTime(0.0001, now, 0.045);
      shimmerGain.gain.setTargetAtTime(0.0001, now, 0.035);

      window.setTimeout(() => {
        try {
          reservoir.stop();
          hum.stop();
          shimmer.stop();
        } catch {}
      }, 140);

      if (release) {
        scheduleTone(context, {
          attack: 0.002,
          duration: 0.12,
          endFrequency: 360 + pressure * 320,
          frequency: 720 + pressure * 760,
          gain: 0.032 + pressure * 0.03,
          type: "triangle",
        });
        scheduleTone(context, {
          attack: 0.001,
          delay: 0.018,
          duration: 0.08,
          endFrequency: 1280 + pressure * 820,
          frequency: 920 + pressure * 680,
          gain: 0.018 + pressure * 0.018,
          type: "square",
        });
        scheduleNoise(context, {
          delay: 0.012,
          duration: 0.035,
          filterFrequency: 2600 + pressure * 1800,
          filterType: "bandpass",
          gain: 0.008 + pressure * 0.01,
          q: 3.2,
        });
      }
    },
  };

  unregister = registerPourLoop(loop);
  return loop;
}

export function startPourLoop({ heavy = false, leaky = false, reverse = false } = {}) {
  const context = getPlayableContext();
  if (!context || !mixBus) return { stop: () => {}, update: () => {} };

  stopActivePourLoops({ release: false });

  const startTime = context.currentTime;
  const stream = context.createBufferSource();
  const streamFilter = context.createBiquadFilter();
  const streamGain = context.createGain();
  const foamFilter = context.createBiquadFilter();
  const foamGain = context.createGain();
  const bodyFilter = context.createBiquadFilter();
  const bodyGain = context.createGain();
  const flowLfo = context.createOscillator();
  const flowLfoDepth = context.createGain();
  const bubbleTimers = new Set();
  let stopped = false;
  let pressure = reverse ? 0.62 : 0.42;

  stream.buffer = getNoiseBuffer(context);
  stream.loop = true;

  streamFilter.type = leaky ? "bandpass" : "lowpass";
  streamFilter.frequency.setValueAtTime(
    leaky ? 620 : heavy ? 620 : reverse ? 740 : 1120,
    startTime,
  );
  streamFilter.Q.value = leaky ? 1.05 : heavy ? 0.28 : 0.42;

  foamFilter.type = "bandpass";
  foamFilter.frequency.setValueAtTime(heavy ? 980 : leaky ? 1250 : 1650, startTime);
  foamFilter.Q.value = 0.65;

  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(heavy ? 210 : reverse ? 240 : 310, startTime);
  bodyFilter.Q.value = 0.55;

  streamGain.gain.setValueAtTime(0.0001, startTime);
  foamGain.gain.setValueAtTime(0.0001, startTime);
  bodyGain.gain.setValueAtTime(0.0001, startTime);
  streamGain.gain.linearRampToValueAtTime(
    heavy ? 0.064 : leaky ? 0.03 : reverse ? 0.036 : 0.042,
    startTime + 0.16,
  );
  foamGain.gain.linearRampToValueAtTime(
    heavy ? 0.014 : leaky ? 0.006 : reverse ? 0.008 : 0.01,
    startTime + 0.18,
  );
  bodyGain.gain.linearRampToValueAtTime(
    heavy ? 0.026 : reverse ? 0.014 : 0.01,
    startTime + 0.2,
  );

  flowLfo.type = "sine";
  flowLfo.frequency.setValueAtTime(heavy ? 1.35 : leaky ? 2.2 : 2.8, startTime);
  flowLfoDepth.gain.setValueAtTime(heavy ? 34 : leaky ? 38 : 72, startTime);
  flowLfo.connect(flowLfoDepth);
  flowLfoDepth.connect(streamFilter.frequency);

  stream.connect(streamFilter);
  stream.connect(foamFilter);
  stream.connect(bodyFilter);
  streamFilter.connect(streamGain);
  foamFilter.connect(foamGain);
  bodyFilter.connect(bodyGain);
  streamGain.connect(mixBus);
  foamGain.connect(mixBus);
  bodyGain.connect(mixBus);
  stream.start(startTime);
  flowLfo.start(startTime);

  const pulse = () => {
    if (stopped) return;

    const pan = (Math.random() - 0.5) * 0.16;
    const dropSize = 0.55 + Math.random() * 0.35 + pressure * 0.22;
    const dropFrequency = leaky
      ? 420 + Math.random() * 280
      : reverse
        ? 380 + pressure * 360 + Math.random() * 240
        : 520 + pressure * 560 + Math.random() * 300;

    scheduleNoise(context, {
      duration: 0.045 + dropSize * 0.025,
      filterFrequency: dropFrequency,
      filterType: "bandpass",
      gain: (leaky ? 0.01 : 0.012) * dropSize,
      pan,
      q: leaky ? 1.9 : 2.2,
    });
    scheduleNoise(context, {
      delay: 0.018,
      duration: 0.035 + pressure * 0.018,
      filterFrequency: 1350 + pressure * 900 + Math.random() * 420,
      filterType: "bandpass",
      gain: 0.003 + pressure * 0.005,
      pan: -pan * 0.6,
      q: 0.9,
    });

    const delay = leaky
      ? 260 + Math.random() * 190
      : 190 + (1 - pressure) * 130 + Math.random() * 140;
    const timerId = window.setTimeout(pulse, delay);
    bubbleTimers.add(timerId);
  };

  if (heavy) {
    scheduleNoise(context, {
      delay: 0.012,
      duration: 0.19,
      filterFrequency: 360,
      filterType: "lowpass",
      gain: 0.052,
      q: 0.48,
    });
    scheduleSplash(context, {
      brightness: 0.72,
      delay: 0.06,
      size: 1.8,
    });
  } else {
    const timerId = window.setTimeout(pulse, 70);
    bubbleTimers.add(timerId);
  }

  let unregister = () => {};
  const loop = {
    update(nextPressure = pressure) {
      if (stopped) return;

      pressure = clamp01(nextPressure);
      const now = context.currentTime;

      streamFilter.frequency.setTargetAtTime(
        leaky
          ? 520 + pressure * 460
          : heavy
            ? 430 + pressure * 520
            : reverse
              ? 600 + pressure * 640
              : 850 + pressure * 1150,
        now,
        0.12,
      );
      foamFilter.frequency.setTargetAtTime(
        heavy
          ? 820 + pressure * 720
          : leaky ? 980 + pressure * 760 : 1250 + pressure * 1300,
        now,
        0.14,
      );
      bodyFilter.frequency.setTargetAtTime(
        heavy ? 190 + pressure * 150 : reverse ? 210 + pressure * 180 : 260 + pressure * 220,
        now,
        0.12,
      );
      streamGain.gain.setTargetAtTime(
        heavy
          ? 0.052 + pressure * 0.07
          : leaky ? 0.024 + pressure * 0.034 : 0.032 + pressure * 0.052,
        now,
        0.11,
      );
      foamGain.gain.setTargetAtTime(
        heavy
          ? 0.012 + pressure * 0.018
          : leaky ? 0.005 + pressure * 0.012 : 0.006 + pressure * 0.018,
        now,
        0.11,
      );
      bodyGain.gain.setTargetAtTime(
        heavy
          ? 0.024 + pressure * 0.026
          : reverse ? 0.012 + pressure * 0.02 : 0.008 + pressure * 0.018,
        now,
        0.1,
      );
      flowLfo.frequency.setTargetAtTime(
        heavy ? 1.08 + pressure * 0.7 : leaky ? 1.9 + pressure * 1.9 : 2.4 + pressure * 2.5,
        now,
        0.16,
      );
      flowLfoDepth.gain.setTargetAtTime(
        heavy ? 28 + pressure * 48 : leaky ? 32 + pressure * 58 : 52 + pressure * 105,
        now,
        0.16,
      );
    },
    stop({ level = 0, release = true } = {}) {
      if (stopped) return;

      stopped = true;
      unregister();
      bubbleTimers.forEach((timer) => window.clearTimeout(timer));
      bubbleTimers.clear();

      const now = context.currentTime;
      streamGain.gain.cancelScheduledValues(now);
      foamGain.gain.cancelScheduledValues(now);
      bodyGain.gain.cancelScheduledValues(now);
      flowLfoDepth.gain.cancelScheduledValues(now);
      streamGain.gain.setTargetAtTime(0.0001, now, 0.045);
      foamGain.gain.setTargetAtTime(0.0001, now, 0.04);
      bodyGain.gain.setTargetAtTime(0.0001, now, 0.055);
      flowLfoDepth.gain.setTargetAtTime(0.0001, now, 0.035);

      window.setTimeout(() => {
        try {
          stream.stop();
          flowLfo.stop();
        } catch {}
      }, 160);

      if (release) {
        playPourRelease(level);
      }
    },
  };

  unregister = registerPourLoop(loop);
  return loop;
}

export function playPourRelease(level = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound("pour-release", 80)) return;

  const ratio = clamp01(level / 100);
  scheduleNoise(context, {
    duration: 0.12,
    filterFrequency: 520 + ratio * 920,
    filterType: "bandpass",
    gain: 0.052,
    q: 1.8,
  });
  scheduleNoise(context, {
    delay: 0.028,
    duration: 0.075,
    filterFrequency: 340 + ratio * 260,
    filterType: "lowpass",
    gain: 0.022,
    q: 0.6,
  });
  scheduleTone(context, {
    attack: 0.004,
    delay: 0.015,
    duration: 0.1,
    endFrequency: 92 + ratio * 45,
    frequency: 145 + ratio * 75,
    gain: 0.012,
    type: "sine",
  });
}

export function playRoundResult(score = 0, diff = 0) {
  const context = getPlayableContext();
  if (!context || !allowSound("round-result", 180)) return;

  const quality = clamp01(score / 10);
  const root = 230 + quality * 260;

  if (score <= 0.05) {
    scheduleNoise(context, {
      duration: 0.16,
      filterFrequency: 190,
      filterType: "lowpass",
      gain: 0.034,
      q: 0.8,
    });
    scheduleTone(context, {
      attack: 0.004,
      duration: 0.26,
      endFrequency: 72,
      frequency: 155 + diff * 1.5,
      gain: 0.048,
      type: "sine",
    });
    scheduleTone(context, {
      attack: 0.006,
      delay: 0.12,
      duration: 0.18,
      endFrequency: 54,
      frequency: 92,
      gain: 0.026,
      type: "triangle",
    });
    return;
  }

  scheduleSplash(context, {
    brightness: 0.72 + quality * 1.2,
    size: quality > 0.82 ? 1.14 : 0.82 + quality * 0.24,
  });

  const motif =
    quality >= 0.95
      ? [1, 1.25, 1.5, 2]
      : quality >= 0.7
        ? [1, 1.22, 1.52]
        : [1, 1.18];

  motif.forEach((ratio, index) => {
    scheduleBubble(context, {
      delay: index * (quality >= 0.95 ? 0.042 : 0.055),
      duration: 0.095 + quality * 0.035,
      frequency: root * ratio,
      gain: 0.022 + quality * 0.018 - index * 0.002,
      pan: (index - (motif.length - 1) / 2) * 0.05,
      rise: 1.04 + quality * 0.52,
    });
  });
}

export function startRoundScoreCountSound({ duration = 0.95, score = 0 } = {}) {
  const context = getPlayableContext();
  if (!context || !allowSound("round-score-count", 180)) {
    return { finish() {}, stop() {} };
  }

  const startTime = context.currentTime;
  const quality = clamp01(score / 10);
  const scoreDuration =
    score <= 0.05 ? 0.22 : Math.max(0.28, duration * (0.32 + quality * 0.68));
  const endTime = startTime + scoreDuration;

  if (score <= 0.05) {
    scheduleTone(context, {
      attack: 0.004,
      duration: 0.18,
      endFrequency: 82,
      frequency: 140,
      gain: 0.026,
      type: "triangle",
    });

    let stopped = false;

    return {
      finish() {
        if (stopped) return;
        scheduleTone(context, {
          attack: 0.003,
          duration: 0.18,
          endFrequency: 58,
          frequency: 96,
          gain: 0.03,
          type: "sine",
        });
      },
      stop() {
        stopped = true;
      },
    };
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = quality > 0.82 ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(140 + quality * 42, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    285 + quality * 430,
    endTime,
  );
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.005 + quality * 0.003, startTime + 0.06);
  gain.gain.linearRampToValueAtTime(
    0.012 + quality * 0.034,
    Math.max(startTime + 0.08, endTime - 0.1),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
  oscillator.connect(gain);
  gain.connect(mixBus || context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);

  const pulseCount = Math.max(2, Math.min(5, Math.ceil(score / 2.25)));
  Array.from({ length: pulseCount }).forEach((_, index) => {
    const offset = (index + 1) / (pulseCount + 1);
    scheduleBubble(context, {
      delay: Math.min(scoreDuration * offset, Math.max(0, scoreDuration - 0.08)),
      duration: 0.07 + index * 0.014,
      frequency: 250 + quality * 150 + index * (62 + quality * 18),
      gain: 0.007 + index * 0.003 + quality * 0.008,
      pan: (index - (pulseCount - 1) / 2) * 0.035,
      rise: 1.02 + quality * 0.36,
    });
  });

  let stopped = false;

  return {
    finish() {
      if (stopped) return;
      scheduleBubble(context, {
        delay: 0,
        duration: 0.1 + quality * 0.04,
        frequency: 420 + quality * 260,
        gain: 0.016 + quality * 0.02,
        rise: 1.12 + quality * 0.35,
      });
      if (score >= 9.95) {
        [1, 1.26, 1.5, 1.9].forEach((ratio, index) => {
          scheduleBubble(context, {
            delay: 0.035 + index * 0.045,
            duration: 0.11,
            frequency: (520 + quality * 120) * ratio,
            gain: 0.024 - index * 0.002,
            pan: (index - 1.5) * 0.06,
            rise: 1.55,
          });
        });
        scheduleSplash(context, {
          brightness: 1.65,
          delay: 0.08,
          size: 0.72,
        });
      } else if (score >= 7) {
        [1.18, 1.42].forEach((ratio, index) => {
          scheduleBubble(context, {
            delay: 0.035 + index * 0.052,
            duration: 0.095,
            frequency: (440 + quality * 170) * ratio,
            gain: 0.018 + quality * 0.006,
            pan: (index - 0.5) * 0.045,
            rise: 1.28,
          });
        });
      }
    },
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.025);
        oscillator.stop(context.currentTime + 0.08);
      } catch {
        // The oscillator may already be stopped.
      }
    },
  };
}

export function playRoundAdvance() {
  const context = getPlayableContext();
  if (!context || !allowSound("round-advance", 120)) return;

  scheduleSplash(context, {
    brightness: 1.1,
    size: 0.9,
  });
  [300, 430, 620].forEach((frequency, index) => {
    scheduleBubble(context, {
      delay: index * 0.045,
      duration: 0.085,
      frequency,
      gain: 0.032 - index * 0.004,
      pan: (index - 1) * 0.04,
      rise: 1.28,
    });
  });
}

export function playFinalScore(totalScore = 0, maxScore = 50) {
  const context = getPlayableContext();
  if (!context || !allowSound("final-score", 650)) return;

  const ratio = clamp01(totalScore / Math.max(1, maxScore));
  const root = 250 + ratio * 160;
  const pattern =
    ratio > 0.82
      ? [1, 1.25, 1.5, 1.88, 2.35]
      : ratio > 0.55
        ? [1, 1.18, 1.42, 1.76]
        : [1, 0.86, 0.72];

  scheduleSplash(context, {
    brightness: 0.9 + ratio * 1.4,
    size: ratio > 0.75 ? 1.55 : 1.05,
  });

  pattern.forEach((noteRatio, index) => {
    scheduleBubble(context, {
      delay: index * 0.085,
      duration: 0.15 + index * 0.018,
      frequency: root * noteRatio,
      gain: 0.046 - index * 0.004,
      pan: (index - 2) * 0.04,
      rise: ratio > 0.5 ? 1.18 : 0.86,
    });
  });
}

function playSoundEnabled() {
  const context = getPlayableContext();
  if (!context || !allowSound("sound-enabled", 120)) return;

  scheduleSplash(context, {
    brightness: 1.1,
    size: 0.75,
  });
  scheduleBubble(context, {
    delay: 0.025,
    duration: 0.12,
    frequency: 430,
    gain: 0.04,
    rise: 1.58,
  });
}
