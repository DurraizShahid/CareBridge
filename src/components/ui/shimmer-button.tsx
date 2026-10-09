import React, { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Legacy API compatibility. Former animated/shimmer effects are intentionally
 * removed; all placement actions now use the CareBridge clinical pill treatment.
 */
export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({
    shimmerColor: _shimmerColor,
    shimmerSize: _shimmerSize,
    shimmerDuration: _shimmerDuration,
    borderRadius: _borderRadius,
    background: _background,
    className,
    style,
    children,
    ...props
  }, ref) => (
    <button
      {...props}
      ref={ref}
      style={{ ...style, borderRadius: "999px", background: "#D9F477", color: "#26390A" }}
      className={cn("inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(16,43,78,0.055)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,43,78,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#255DCE] disabled:pointer-events-none disabled:opacity-50", className)}
    >
      {children}
    </button>
  )
);
ShimmerButton.displayName = "ShimmerButton";