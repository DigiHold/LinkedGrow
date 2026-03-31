import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

export function Logo({ size = "lg", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white",
        sizeClasses[size],
        className
      )}
    >
      Linked
      <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
        Grow
      </span>
    </span>
  );
}
