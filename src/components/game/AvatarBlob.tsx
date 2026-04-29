// Stylized avatar (initial in a colored gradient blob) — game-like.
import { cn } from "@/lib/utils";

interface AvatarBlobProps {
  name: string;
  hue: number;
  size?: number;
  rank?: "rookie" | "pro" | "elite" | "legend";
  className?: string;
}

const rankRing: Record<string, string> = {
  rookie: "ring-muted",
  pro: "ring-accent",
  elite: "ring-secondary",
  legend: "ring-primary",
};

export const AvatarBlob = ({ name, hue, size = 56, rank = "rookie", className }: AvatarBlobProps) => {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-2xl border-[3px] border-ink shadow-pop-sm font-display select-none",
        "ring-4 ring-offset-2 ring-offset-surface",
        rankRing[rank],
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 90% 70%), hsl(${(hue + 40) % 360} 95% 60%))`,
        fontSize: size * 0.5,
        color: "hsl(var(--ink))",
      }}
    >
      <span className="drop-shadow-[0_2px_0_hsl(var(--surface)/0.6)]">{initial}</span>
    </div>
  );
};
