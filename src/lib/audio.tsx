// Global reactive audio system: BGM with crossfade + SFX (mute by default).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type BgmTrack = "odyssey" | "profile" | null;

interface AudioCtx {
  muted: boolean;
  toggleMute: () => void;
  setBgm: (track: BgmTrack) => void;
  playSfx: (name: "hover" | "click" | "zoom" | "xp") => void;
}

// Free CDN-hosted placeholders (royalty-free / pixabay-style mirrors).
// They degrade gracefully if unreachable.
const SOURCES = {
  odyssey: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-cinematic-trailer-114577.mp3",
  profile: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=ambient-piano-amp-strings-10711.mp3",
  hover: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8e5b00b1e.mp3?filename=pop-39222.mp3",
  click: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_d1718beea4.mp3?filename=click-21156.mp3",
  zoom: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_4754c5b2a9.mp3?filename=interface-124464.mp3",
  xp: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2c8b1f9b7a.mp3?filename=collect-points-190037.mp3",
};

const Ctx = createContext<AudioCtx | null>(null);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(true);
  const bgmA = useRef<HTMLAudioElement | null>(null);
  const bgmB = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<"A" | "B">("A");
  const currentTrack = useRef<BgmTrack>(null);
  const fadeTimer = useRef<number | null>(null);

  // Lazy create elements
  useEffect(() => {
    if (typeof window === "undefined") return;
    bgmA.current = new Audio();
    bgmA.current.loop = true;
    bgmA.current.volume = 0;
    bgmB.current = new Audio();
    bgmB.current.loop = true;
    bgmB.current.volume = 0;
    return () => {
      bgmA.current?.pause();
      bgmB.current?.pause();
    };
  }, []);

  const fadeTo = useCallback((el: HTMLAudioElement, target: number, ms = 800) => {
    if (fadeTimer.current) window.clearInterval(fadeTimer.current);
    const start = el.volume;
    const startT = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startT) / ms);
      el.volume = start + (target - start) * t;
      if (t >= 1) {
        if (target === 0) el.pause();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const setBgm = useCallback((track: BgmTrack) => {
    if (currentTrack.current === track) return;
    currentTrack.current = track;
    const a = bgmA.current, b = bgmB.current;
    if (!a || !b) return;
    const active = activeRef.current === "A" ? a : b;
    const next = activeRef.current === "A" ? b : a;
    // fade out current
    fadeTo(active, 0, 700);
    if (track) {
      next.src = SOURCES[track];
      next.currentTime = 0;
      next.volume = 0;
      if (!muted) {
        next.play().catch(() => {});
        fadeTo(next, 0.35, 900);
      }
      activeRef.current = activeRef.current === "A" ? "B" : "A";
    }
  }, [muted, fadeTo]);

  // React to mute changes
  useEffect(() => {
    const a = bgmA.current, b = bgmB.current;
    if (!a || !b) return;
    if (muted) {
      fadeTo(a, 0, 400);
      fadeTo(b, 0, 400);
    } else if (currentTrack.current) {
      const active = activeRef.current === "A" ? a : b;
      if (!active.src) active.src = SOURCES[currentTrack.current];
      active.play().catch(() => {});
      fadeTo(active, 0.35, 700);
    }
  }, [muted, fadeTo]);

  const playSfx = useCallback((name: "hover" | "click" | "zoom" | "xp") => {
    if (muted) return;
    try {
      const el = new Audio(SOURCES[name]);
      el.volume = name === "hover" ? 0.25 : name === "xp" ? 0.55 : 0.5;
      el.play().catch(() => {});
    } catch { /* noop */ }
  }, [muted]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return (
    <Ctx.Provider value={{ muted, toggleMute, setBgm, playSfx }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAudio = () => {
  const c = useContext(Ctx);
  if (!c) {
    // SSR-safe no-op fallback
    return {
      muted: true,
      toggleMute: () => {},
      setBgm: () => {},
      playSfx: () => {},
    } as AudioCtx;
  }
  return c;
};
