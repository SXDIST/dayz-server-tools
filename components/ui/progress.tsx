import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-white/10",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-cyan-200 via-sky-300 to-indigo-300 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
