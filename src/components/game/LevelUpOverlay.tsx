// Level-up celebration overlay with confetti + bouncing badge.
import { useEffect, useMemo, useRef } from "react";
import { ChevronRight, Trophy } from "lucide-react";

interface LevelUpProps {
  oldLevel: number;
  newLevel: number;
  studentName: string;
  onComplete: () => void;
}

export const LevelUpOverlay = ({ oldLevel, newLevel, studentName, onComplete }: LevelUpProps) => {
  // SFX joyeux joué UNIQUEMENT au franchissement d'un niveau global complet
  // (déclenché par le mount de l'overlay, déclenché lui-même par newLevel > oldLevel).
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    try {
      const a = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      a.volume = 0.8;
      audioRef.current = a;
      void a.play().catch(() => { /* autoplay bloqué : on ignore silencieusement */ });
    } catch { /* noop */ }
    return () => {
      // Si l'utilisateur skippe l'animation, on coupe le son immédiatement.
      const a = audioRef.current;
      if (a) { try { a.pause(); a.currentTime = 0; } catch { /* noop */ } }
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(onComplete, 4000);
    return () => clearTimeout(t);
  }, [onComplete]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2 + Math.random() * 2,
        color: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--hot))"][i % 4],
        size: 6 + Math.random() * 10,
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-[7000] grid place-items-center bg-ink/85 backdrop-blur-md cursor-pointer animate-fade-in select-none overflow-hidden"
    >
      {/* Confetti */}
      {confetti.map((c, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 1.4,
            background: c.color,
            transform: `rotate(${c.rotate}deg)`,
            animation: `confetti-fall ${c.duration}s ${c.delay}s linear forwards`,
            border: "2px solid hsl(var(--ink))",
          }}
        />
      ))}

      <div className="text-center px-6 animate-pop-in">
        <div className="relative inline-grid place-items-center mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl scale-150" />
          <div className="relative grid place-items-center w-40 h-40 rounded-full bg-gradient-sun border-[6px] border-ink shadow-pop-lg animate-bounce-soft">
            <Trophy size={80} className="text-ink drop-shadow-[0_3px_0_hsl(var(--ink)/0.2)]" strokeWidth={2.5} />
          </div>
        </div>

        <p className="font-display text-3xl md:text-5xl tracking-widest text-secondary mb-2">
          ✨ Level Up ! ✨
        </p>
        <h1 className="font-display text-6xl md:text-8xl text-surface drop-shadow-[0_6px_0_hsl(var(--ink))] mb-10">
          {studentName}
        </h1>

        <div className="inline-flex items-center gap-6 md:gap-10 bg-surface border-[4px] border-ink rounded-3xl px-8 py-6 shadow-pop-lg">
          <div className="text-center">
            <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Avant</div>
            <div className="font-display text-5xl text-muted-foreground">N{oldLevel}</div>
          </div>
          <ChevronRight size={48} className="text-primary animate-pulse" strokeWidth={3} />
          <div className="text-center">
            <div className="text-xs font-bold uppercase text-accent tracking-wider">Nouveau</div>
            <div className="font-display text-7xl text-gradient-sun">N{newLevel}</div>
          </div>
        </div>

        <p className="text-surface/60 text-xs uppercase tracking-widest mt-8">(touche pour continuer)</p>
      </div>
    </div>
  );
};
