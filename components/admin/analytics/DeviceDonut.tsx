/**
 * `<DeviceDonut />` — server-rendered SVG donut chart za breakdown
 * obiskovalcev po napravi (mobile / tablet / desktop) ali kateri koli
 * 3-bucket kategoriji.
 *
 * **Implementation note (april 2026):** prej je uporabljal stacked
 * `<circle>` elemente z `strokeDasharray` triku. Težava: ob 3 segmentih
 * z različnimi rotacijami so antialiasing pixli na boundaries puščali
 * vidne flicker-line, in ni bilo mogoče dodati gap-a med segmenti.
 *
 * Po: vsak segment je `<path d="M ... A">` (SVG arc), ki rendira točno
 * geometrijo — clean polygon-style boundaries + 1.5° presledek med
 * segmenti za vizualno ločitev. Edge case: 1 segment (= 100%) rendira
 * kot polni circle brez gap-a.
 *
 * Auto-themed preko CSS variables — strokes se osvežijo ob theme switchu.
 */

import { cn } from "@/lib/utils";

export type DonutTone =
  | "accent"
  | "success"
  | "warning"
  | "neutral"
  | "accent2"
  | "muted";

export type DonutSlice = {
  label: string;
  value: number;
  tone: DonutTone;
};

type Slice = DonutSlice;

type Props = {
  slices: Slice[];
  /** Centered text label (npr. skupaj). */
  centerValue?: number | string;
  centerLabel?: string;
};

// Geometrija — bumped iz 140 → 160 za boljšo berljivost na desktop-u.
const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
/** Vizualni gap med segmenti v stopinjah (samo če imamo > 1 segment). */
const GAP_DEG = 1.5;

const TONE_STROKE: Record<Slice["tone"], string> = {
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  neutral: "var(--text)",
  accent2: "var(--accent-2)",
  muted: "var(--text-muted)",
};

const TONE_DOT: Record<Slice["tone"], string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  neutral: "bg-text",
  accent2: "bg-accent-2",
  muted: "bg-muted",
};

/**
 * Pretvori (centerX, centerY, radius, angleDeg) → (x, y) na obodu kroga.
 * angleDeg = 0 je 12 ura (vrh), narašča v smeri urinega kazalca.
 */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): {
  x: number;
  y: number;
} {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Zgradi SVG `d` atribut za arc med dvema kotoma. CW (clockwise) smer.
 *
 * - `largeArcFlag` = 1 če arc > 180°, 0 sicer (SVG arc convention).
 * - `sweepFlag` = 1 (positive direction = CW glede na koordinatni sistem).
 *
 * Note: pri zelo majhnih arc-ih (< gap) `endAngle <= startAngle` — caller
 * ne sme v tem primeru klicati build-Arc, sicer vrne degenerate path.
 */
function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngleDeg);
  const end = polarToCartesian(cx, cy, r, endAngleDeg);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

export function DeviceDonut({ slices, centerValue, centerLabel }: Props) {
  const visibleSlices = slices.filter((s) => s.value > 0);
  const total = visibleSlices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="text-muted type-small flex flex-col items-center justify-center gap-2 py-6">
        <span
          aria-hidden
          className="border-border h-10 w-10 rounded-full border-2 border-dashed"
        />
        <span>Ni podatkov</span>
      </div>
    );
  }

  // Ko imamo SAMO en segment (100%), narisanje arc-a z `endAngle - startAngle = 360°`
  // + gap-om bi povzročilo "izgubljen" arc (start === end). V tem primeru
  // narisemo polni `<circle>` — najbolj natanko 100% predstavi.
  const singleSlice = visibleSlices.length === 1 ? visibleSlices[0] : null;

  // Build arc segments — vsak ima absolute startAngle/endAngle, gap simulrian
  // z odstevanjem GAP_DEG/2 z vsake strani. Math: cumulative sum of ratios * 360.
  const segments = singleSlice
    ? []
    : visibleSlices.map((slice, i, arr) => {
        const ratio = slice.value / total;
        const sweepDeg = ratio * 360;
        // Cumulative start angle: vsota prejšnjih sweep-ov.
        const startCumulative = arr
          .slice(0, i)
          .reduce((acc, s) => acc + (s.value / total) * 360, 0);
        // Apply gap inset (samo če imamo več segmentov in segment je dovolj velik).
        const gapHalf = GAP_DEG / 2;
        const safeGap = sweepDeg > GAP_DEG * 2 ? gapHalf : 0;
        return {
          ...slice,
          ratio,
          startAngle: startCumulative + safeGap,
          endAngle: startCumulative + sweepDeg - safeGap,
        };
      });

  return (
    <div className="flex flex-row items-center gap-5 sm:gap-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-[140px] shrink-0 sm:w-[160px]"
        role="img"
        aria-label="Razdelitev po kategorijah"
      >
        {/* Background ring (subtle) — viden samo ob hover (preview slice
            boundaries). */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeOpacity={0.15}
          strokeWidth={STROKE}
        />

        {/* Single-slice (100%) → polni circle, brez arc gap problema. */}
        {singleSlice ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={TONE_STROKE[singleSlice.tone]}
            strokeWidth={STROKE}
          >
            <title>{`${singleSlice.label}: ${singleSlice.value} (100%)`}</title>
          </circle>
        ) : null}

        {/* Multi-slice → vsak segment kot ločen path (arc command). */}
        {segments.map((seg, i) => (
          <path
            key={`${seg.label}-${i}`}
            d={buildArcPath(CENTER, CENTER, RADIUS, seg.startAngle, seg.endAngle)}
            fill="none"
            stroke={TONE_STROKE[seg.tone]}
            strokeWidth={STROKE}
            strokeLinecap="butt"
          >
            <title>{`${seg.label}: ${seg.value} (${Math.round(seg.ratio * 100)}%)`}</title>
          </path>
        ))}

        {/* Center text */}
        {centerValue !== undefined ? (
          <g>
            <text
              x={CENTER}
              y={CENTER - 2}
              textAnchor="middle"
              fontSize={24}
              fontWeight={700}
              fill="var(--text)"
              fontFamily="var(--font-display, ui-serif, Georgia, serif)"
            >
              {centerValue}
            </text>
            {centerLabel ? (
              <text
                x={CENTER}
                y={CENTER + 16}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-subtle)"
                style={{ letterSpacing: "0.16em" }}
                fontWeight={600}
              >
                {centerLabel.toUpperCase()}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* Legenda — desno od donut-a */}
      <ul className="type-small flex min-w-0 flex-1 flex-col gap-2">
        {visibleSlices.map((slice) => {
          const ratio = slice.value / total;
          return (
            <li key={slice.label} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                  TONE_DOT[slice.tone],
                )}
              />
              <span className="text-text truncate font-medium">{slice.label}</span>
              <span className="text-subtle ml-auto shrink-0 tabular-nums">
                {slice.value} · {Math.round(ratio * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
