// Reusable chunky "pop" button with multiple variants.
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "hot" | "ghost" | "ink";
type Size = "sm" | "md" | "lg";

interface PopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-glow",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-glow",
  accent: "bg-accent text-accent-foreground hover:bg-accent-glow",
  hot: "bg-hot text-hot-foreground hover:brightness-110",
  ghost: "bg-surface text-foreground hover:bg-surface-2",
  ink: "bg-ink text-surface hover:bg-ink-soft",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-xs rounded-xl gap-1.5",
  md: "px-5 py-3 text-sm rounded-2xl gap-2",
  lg: "px-7 py-4 text-base rounded-2xl gap-3",
};

export const PopButton = forwardRef<HTMLButtonElement, PopButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-display tracking-wider uppercase",
        "border-[3px] border-ink shadow-pop-sm",
        "transition-all duration-150 active:translate-y-[3px] active:shadow-none",
        "hover:-translate-y-0.5 hover:shadow-pop",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-pop-sm",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
PopButton.displayName = "PopButton";
