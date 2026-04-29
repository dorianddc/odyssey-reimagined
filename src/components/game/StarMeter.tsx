// Interactive stars row for one skill — click to add, right-click or minus to remove.
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarMeterProps {
  value: number; // 0..5
  onIncrement?: () => void;
  onDecrement?: () => void;
  size?: number;
  interactive?: boolean;
  burstKey?: number; // change to trigger burst animation
}

export const StarMeter = ({
  value,
  onIncrement,
  onDecrement,
  size = 22,
  interactive = true,
  burstKey = 0,
}: StarMeterProps) => {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        const isLastNew = interactive && i === value - 1;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => {
              if (!interactive) return;
              if (i + 1 > value) onIncrement?.();
              else if (i + 1 === value) onDecrement?.();
              else onIncrement?.();
            }}
            className={cn(
              "relative grid place-items-center transition-transform",
              interactive && "hover:scale-125 active:scale-95",
              filled ? "text-star-gold" : "text-muted"
            )}
            aria-label={`palier ${i + 1}`}
          >
            <Star
              size={size}
              strokeWidth={2.5}
              fill={filled ? "currentColor" : "transparent"}
              className={cn(
                "drop-shadow-[0_2px_0_hsl(var(--ink))]",
                isLastNew && burstKey > 0 && "animate-star-burst"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
