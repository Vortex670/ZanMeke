/**
 * `<ActivityHeatmap />` — GitHub-style heatmap, 7 dni × 24 ur (168 cells).
 * Pokaže "kdaj v tednu" so ljudje na strani.
 *
 * Cell intensity: 0 = bg-bg/30, max = bg-accent. Linearno interpolirano.
 *
 * Server-rendered SVG, brez JS.
 */

type HourPoint = { dow: number; hour: number; views: number };

type HeatmapLabels = {
  /** 7 kratkih imen dni, pon → ned. */
  days?: readonly string[];
  less?: string;
  more?: string;
  /** "12 ogledov" v tooltip-u celice. */
  views?: (count: number) => string;
  ariaLabel?: string;
};

type Props = {
  data: HourPoint[];
  /** I18n labeli — privzeto slovenski (parent jih poda prek `t()`). */
  labels?: HeatmapLabels;
};

const DEFAULT_DAY_LABELS = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];
const HOUR_LABELS = [0, 6, 12, 18];

const CELL_W = 24;
const CELL_H = 22;
const GAP = 3;
const PADDING_LEFT = 36;
const PADDING_TOP = 18;

export function ActivityHeatmap({ data, labels }: Props) {
  const DAY_LABELS = labels?.days?.length === 7 ? labels.days : DEFAULT_DAY_LABELS;
  const viewsLabel = labels?.views ?? ((n: number) => `${n} ogledov`);
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  // Build 7×24 lookup
  const grid = new Map<string, number>();
  for (const d of data) {
    grid.set(`${d.dow}:${d.hour}`, d.views);
  }

  const width = PADDING_LEFT + 24 * (CELL_W + GAP);
  const height = PADDING_TOP + 7 * (CELL_H + GAP);

  /** opacity 0.05 (no activity) → 0.95 (max). */
  const opacityFor = (v: number) => {
    if (v === 0) return 0.06;
    const ratio = v / maxViews;
    return 0.15 + ratio * 0.8;
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* `min-w` na telefonu: brez nje se `w-full` graf stisne v širino
          zaslona in črte, oznake in dnevi se zlijejo v kašo — `overflow-x-auto`
          nima česa drsati, ker nič ne štrli čez. S stalno najmanjšo širino
          graf ostane berljiv in se ga premakne s prstom. Od `sm` se spet
          prilagodi širini stolpca. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full max-sm:min-w-[40rem]"
        role="img"
        aria-label={labels?.ariaLabel ?? "Aktivnost po urah in dnevih"}
      >
        {/* Hour labels (top) */}
        {HOUR_LABELS.map((h) => (
          <text
            key={h}
            x={PADDING_LEFT + h * (CELL_W + GAP) + CELL_W / 2}
            y={PADDING_TOP - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted)"
            fontFamily="ui-monospace, monospace"
          >
            {String(h).padStart(2, "0")}
          </text>
        ))}

        {/* Day rows */}
        {DAY_LABELS.map((day, dow) => (
          <g
            key={day}
            transform={`translate(0, ${PADDING_TOP + dow * (CELL_H + GAP)})`}
          >
            <text
              x={PADDING_LEFT - 6}
              y={CELL_H / 2}
              dy="0.32em"
              textAnchor="end"
              fontSize={10}
              fill="var(--text-muted)"
              fontFamily="ui-monospace, monospace"
            >
              {day}
            </text>
            {Array.from({ length: 24 }).map((_, hour) => {
              const views = grid.get(`${dow}:${hour}`) ?? 0;
              return (
                <rect
                  key={hour}
                  x={PADDING_LEFT + hour * (CELL_W + GAP)}
                  y={0}
                  width={CELL_W}
                  height={CELL_H}
                  rx={3}
                  fill="var(--accent)"
                  fillOpacity={opacityFor(views)}
                >
                  <title>
                    {`${day} ${String(hour).padStart(2, "0")}:00 — ${viewsLabel(views)}`}
                  </title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>

      {/* Skala legenda */}
      <div className="type-small mt-3 flex items-center justify-end gap-2">
        <span className="text-muted">{labels?.less ?? "manj"}</span>
        {[0.06, 0.25, 0.5, 0.75, 0.95].map((op, i) => (
          <span
            key={i}
            aria-hidden
            className="bg-accent inline-block h-3 w-3 rounded-sm"
            style={{ opacity: op }}
          />
        ))}
        <span className="text-muted">{labels?.more ?? "več"}</span>
      </div>
    </div>
  );
}
