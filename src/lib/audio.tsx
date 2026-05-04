// Global reactive audio system: generated BGM + SFX, no remote files.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type BgmTrack = "odyssey" | "profile" | "hub" | "class" | "situation" | "historique" | null;
type SfxName = "hover" | "click" | "zoom" | "xp";

interface AudioCtx {
  muted: boolean;
  toggleMute: () => void;
  setBgm: (track: BgmTrack) => void;
  playSfx: (name: SfxName) => void;
}

type TrackConfig = {
  tempo: number;
  volume: number;
  wave: OscillatorType;
  notes: number[];
  bass: number[];
  pad: number[];
  sparkle?: boolean;
  drive?: boolean;
};

const TRACKS: Exclude<BgmTrack, null>[] = ["odyssey", "profile", "hub", "class", "situation", "historique"];

const TRACK_CONFIG: Record<Exclude<BgmTrack, null>, TrackConfig> = {
  hub: {
    tempo: 92,
    volume: 0.24,
    wave: "triangle",
    notes: [392, 440, 523.25, 587.33, 659.25, 587.33, 523.25, 440],
    bass: [196, 196, 220, 246.94],
    pad: [196, 246.94, 329.63],
    sparkle: true,
  },
  class: {
    tempo: 86,
    volume: 0.22,
    wave: "sine",
    notes: [329.63, 392, 440, 493.88, 440, 392, 329.63, 293.66],
    bass: [164.81, 196, 220, 196],
    pad: [164.81, 220, 329.63],
  },
  profile: {
    tempo: 78,
    volume: 0.2,
    wave: "triangle",
    notes: [261.63, 329.63, 392, 493.88, 440, 392, 329.63, 293.66],
    bass: [130.81, 164.81, 196, 146.83],
    pad: [130.81, 196, 261.63],
    sparkle: true,
  },
  situation: {
    tempo: 124,
    volume: 0.26,
    wave: "square",
    notes: [392, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25],
    bass: [196, 196, 261.63, 293.66],
    pad: [196, 246.94, 392],
    drive: true,
  },
  historique: {
    tempo: 72,
    volume: 0.18,
    wave: "sine",
    notes: [293.66, 349.23, 440, 523.25, 493.88, 440, 349.23, 293.66],
    bass: [146.83, 174.61, 220, 196],
    pad: [146.83, 220, 293.66],
  },
  odyssey: {
    tempo: 104,
    volume: 0.28,
    wave: "sawtooth",
    notes: [392, 493.88, 587.33, 783.99, 698.46, 587.33, 493.88, 392],
    bass: [98, 130.81, 146.83, 196],
    pad: [98, 146.83, 196],
    sparkle: true,
    drive: true,
  },
};

const Ctx = createContext<AudioCtx | null>(null);

const createGain = (ctx: AudioContext, value: number) => {
  const gain = ctx.createGain();
  gain.gain.value = value;
  return gain;
};

const envelope = (gain: GainNode, start: number, peak: number, attack: number, decay: number) => {
  gain.gain.cancelScheduledValues(start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
};

const playTone = (
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) => {
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.0001);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.connect(gain);
  gain.connect(destination);
  envelope(gain, start, volume, Math.min(0.04, duration * 0.25), Math.max(0.05, duration));
  osc.start(start);
  osc.stop(start + duration + 0.08);
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const bgmRef = useRef<GainNode | null>(null);
  const sfxRef = useRef<GainNode | null>(null);
  const currentTrack = useRef<BgmTrack>(null);
  const loopTimer = useRef<number | null>(null);
  const stepRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (loopTimer.current !== null && typeof window !== "undefined") {
      window.clearInterval(loopTimer.current);
      loopTimer.current = null;
    }
  }, []);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtor();
      const master = createGain(ctx, 0.85);
      const bgm = createGain(ctx, 0.0001);
      const sfx = createGain(ctx, 0.8);
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 24;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.22;
      bgm.connect(master);
      sfx.connect(master);
      master.connect(compressor);
      compressor.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      bgmRef.current = bgm;
      sfxRef.current = sfx;
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const scheduleStep = useCallback((track: Exclude<BgmTrack, null>) => {
    const ctx = ctxRef.current;
    const bgm = bgmRef.current;
    if (!ctx || !bgm) return;
    const cfg = TRACK_CONFIG[track];
    const step = stepRef.current++;
    const now = ctx.currentTime + 0.025;
    const beat = 60 / cfg.tempo;
    const note = cfg.notes[step % cfg.notes.length];
    const bass = cfg.bass[Math.floor(step / 2) % cfg.bass.length];

    playTone(ctx, bgm, note, now, beat * 0.42, cfg.volume * 0.22, cfg.wave);
    if (step % 2 === 0) playTone(ctx, bgm, bass, now, beat * 0.86, cfg.volume * 0.32, "triangle");
    if (step % 4 === 0) {
      cfg.pad.forEach((freq, index) => {
        playTone(ctx, bgm, freq, now + index * 0.018, beat * 3.2, cfg.volume * 0.12, "sine");
      });
    }
    if (cfg.sparkle && step % 3 === 0) playTone(ctx, bgm, note * 2, now + beat * 0.55, beat * 0.18, cfg.volume * 0.11, "sine");
    if (cfg.drive) playTone(ctx, bgm, 72, now, beat * 0.08, cfg.volume * 0.5, "square");
  }, []);

  const startLoop = useCallback((track: BgmTrack) => {
    stopLoop();
    const ctx = ensureAudio();
    const bgm = bgmRef.current;
    if (!ctx || !bgm || !track) return;
    const cfg = TRACK_CONFIG[track];
    stepRef.current = 0;
    bgm.gain.cancelScheduledValues(ctx.currentTime);
    bgm.gain.setTargetAtTime(cfg.volume, ctx.currentTime, 0.6);
    scheduleStep(track);
    loopTimer.current = window.setInterval(() => scheduleStep(track), 60000 / cfg.tempo);
  }, [ensureAudio, scheduleStep, stopLoop]);

  const fadeOutBgm = useCallback(() => {
    const ctx = ctxRef.current;
    const bgm = bgmRef.current;
    if (!ctx || !bgm) return;
    bgm.gain.cancelScheduledValues(ctx.currentTime);
    bgm.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  }, []);

  const setBgm = useCallback((track: BgmTrack) => {
    if (currentTrack.current === track) return;
    currentTrack.current = track;
    if (muted) return;
    fadeOutBgm();
    window.setTimeout(() => startLoop(track), 180);
  }, [fadeOutBgm, muted, startLoop]);

  useEffect(() => {
    if (muted) {
      fadeOutBgm();
      stopLoop();
      return;
    }
    startLoop(currentTrack.current);
  }, [fadeOutBgm, muted, startLoop, stopLoop]);

  useEffect(() => () => {
    stopLoop();
    ctxRef.current?.close().catch(() => {});
  }, [stopLoop]);

  const playSfx = useCallback((name: SfxName) => {
    if (muted) return;
    const ctx = ensureAudio();
    const sfx = sfxRef.current;
    if (!ctx || !sfx) return;
    const now = ctx.currentTime + 0.01;

    if (name === "hover") {
      playTone(ctx, sfx, 660, now, 0.08, 0.09, "sine");
      return;
    }
    if (name === "click") {
      playTone(ctx, sfx, 420, now, 0.07, 0.18, "square");
      playTone(ctx, sfx, 720, now + 0.045, 0.08, 0.12, "triangle");
      return;
    }
    if (name === "zoom") {
      [330, 440, 660].forEach((freq, i) => playTone(ctx, sfx, freq, now + i * 0.045, 0.14, 0.13, "sawtooth"));
      return;
    }

    const notes = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1174.66, 1318.51];
    notes.forEach((freq, i) => playTone(ctx, sfx, freq, now + i * 0.22, 0.24, 0.18 - i * 0.01, i % 2 ? "triangle" : "sine"));
    playTone(ctx, sfx, 196, now, 1.9, 0.12, "triangle");
    playTone(ctx, sfx, 1567.98, now + 1.85, 0.45, 0.18, "sine");
  }, [ensureAudio, muted]);

  const toggleMute = useCallback(() => {
    const willUnmute = muted;
    if (willUnmute) ensureAudio();
    setMuted((m) => !m);
    if (willUnmute) {
      window.setTimeout(() => playSfx("click"), 40);
    }
  }, [ensureAudio, muted, playSfx]);

  return (
    <Ctx.Provider value={{ muted, toggleMute, setBgm, playSfx }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAudio = () => {
  const c = useContext(Ctx);
  if (!c) {
    return {
      muted: true,
      toggleMute: () => {},
      setBgm: () => {},
      playSfx: () => {},
    } as AudioCtx;
  }
  return c;
};
