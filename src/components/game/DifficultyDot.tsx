import { cn } from "@/lib/utils";
import type { Difficulty } from "@/data/curriculum";

const DIM_BG: Record<Difficulty["dimension"], string> = {
  moteur: "bg-[oklch(0.65_0.22_25)] text-white",
  methodo: "bg-[oklch(0.82_0.18_115)] text-ink",
  social: "bg-[oklch(0.65_0.18_240)] text-white",
};

interface Props {
  difficulty: Difficulty;
  size?: "sm" | "md";
  showPulse?: boolean;
}

/**
 * Pastille (badge) representing a stagnation/difficulty.
 * - Levels 0/1/2  → high urgency: full opacity + animated red ring (pulse).
 * - Levels 3/4    → low urgency: muted (50% opacity, grayscale tint).
 */
export function DifficultyDot({ difficulty, size = "sm", showPulse = true }: Props) {
  const lvl = difficulty.currentLevel;
  const highUrgency = lvl <= 2;
  const dim = DIM_BG[difficulty.dimension];
  const px = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";

  return (
    <span
      title={`${difficulty.skillCode} · ${difficulty.dimension} · bloqué N${lvl}`}
      className={cn(
        "relative inline-grid place-items-center rounded-full border-[2px] border-ink font-display font-bold tracking-tight shadow-pop-sm",
        px,
        dim,
        highUrgency ? "opacity-100" : "opacity-50 saturate-50"
      )}
    >
      {highUrgency && showPulse && (
        <span className="absolute inset-0 rounded-full ring-2 ring-[oklch(0.65_0.28_25)] animate-ping pointer-events-none" />
      )}
      <span className="relative">{difficulty.skillCode}</span>
    </span>
  );
}
