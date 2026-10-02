import { cn } from "@/lib/utils";

/**
 * `<Sparkline />` — drobni inline trend (SVG črta, brez osi), server-rendered,
 * brez odvisnosti. Uporablja `currentColor` → barvo določa Tailwind
 * `text-*` token na wrapper-ju (npr. `text-accent`), nikoli raw hex.
 *
 * Vgrajen v `StatCard` (`trend` prop) za prikaz gibanja v obdobju.
 */
type Props = {
  data: readonly number[];
  width?: number;
  height?: number;
  className?: string;
  /** Pika na zadnji točki (privzeto true). */
  showLastDot?: boolean;
};

export function Sparkline({
  data,
  width = 72,
  height = 26,
  className,
  showLastDot = true,
}: Props) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const padY = 2;
  const innerH = height - padY * 2;

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: padY + innerH - ((v - min) / range) * innerH,
  }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0 overflow-visible", className)}
      aria-hidden
    >
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLastDot && last ? (
        <circle cx={last.x} cy={last.y} r={2} fill="currentColor" />
      ) : null}
    </svg>
  );
}
