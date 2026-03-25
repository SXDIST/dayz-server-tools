import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
  {
    variants: {
      variant: {
        default: "border-white/15 bg-white/10 text-slate-200",
        accent: "border-cyan-300/30 bg-cyan-300/14 text-cyan-100",
        success: "border-emerald-300/30 bg-emerald-300/14 text-emerald-100",
        warn: "border-amber-300/30 bg-amber-300/14 text-amber-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
