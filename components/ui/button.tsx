import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60",
  {
    variants: {
      variant: {
        default:
          "border border-white/20 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_48px_rgba(15,23,42,0.28)] backdrop-blur-xl hover:bg-white/24",
        primary:
          "border border-cyan-300/30 bg-linear-to-r from-cyan-300/80 to-sky-400/80 text-slate-950 shadow-[0_20px_50px_rgba(34,211,238,0.28)] hover:from-cyan-200 hover:to-sky-300",
        ghost:
          "border border-transparent bg-white/0 text-slate-200 hover:border-white/10 hover:bg-white/10",
        outline:
          "border border-white/18 bg-slate-950/10 text-slate-100 hover:bg-white/10",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
