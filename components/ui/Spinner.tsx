import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
};

/**
 * `Spinner` — preprost CSS spin loader. Brez animation library-ja.
 *
 *   <Spinner size="sm" />
 *   <Spinner size="lg" label="Nalagam" />  ← screenreader-friendly
 */
export function Spinner({ size = "md", className, label = "Nalagam" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeMap[size],
        className,
      )}
    />
  );
}
