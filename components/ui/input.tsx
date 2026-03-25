import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-slate-400/70 focus-visible:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300/20",
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
