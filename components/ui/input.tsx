import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-slate-400/70 focus:border-cyan-300/40 focus:bg-slate-950/28 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(125,211,252,0.16),0_0_0_6px_rgba(56,189,248,0.08)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
