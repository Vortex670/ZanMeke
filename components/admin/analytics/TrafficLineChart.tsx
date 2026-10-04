/**
 * `<TrafficLineChart />` — server-rendered SVG area chart za daily page
 * views + unikatni obiskovalci. Brez JS, brez 3rd-party dep.
 *
 * Zasnova (Tufte data-ink):
 *   - 2 line-a: page views (accent), unique visitors (success)
 *   - Subtle gradient fill pod page-views črto
 *   - X axis: prvi + zadnji datum + middle marker
 *   - Y axis: 0 + max
 *   - Hover guides (CSS-only) — vsak data point ima invisible hit area
 *
 * Auto-themed preko `var(--accent)`, `var(--success)`, `var(--text)`.
 */

type DailyPoint = { date: string; views: number; visitors: number };

type Props = {
  data: DailyPoint[];
  /** Lokaliziran label za "Ogledov". */
  viewsLabel?: string;
  /** Lokaliziran label za "Obiskovalci". */
  visitorsLabel?: string;
};

const WIDTH = 800;
const HEIGHT = 240;
const PADDING = { top: 24, right: 24, bottom: 36, left: 40 };

export function TrafficLineChart({
  data,
  viewsLabel = "Ogledov",
  visitorsLabel = "Obiskovalci",
}: Props) {
  if (data.length === 0) {
    return (
      <div className="text-muted type-small py-12 text-center">
        Ni podatkov v izbranem obdobju.
      </div>
    );
  }

  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const maxVisitors = Math.max(...data.map((d) => d.visitors), 1);
  const maxY = Math.max(maxViews, maxVisitors);

  // X scale: equal step
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const yScale = (v: number) => innerH - (v / maxY) * innerH;

  // ENA SAMA TOČKA NI ČRTA. Pri enem dnevu podatkov je `buildPath` vrnil
  // »M0,157.50« — ukaz, ki pero premakne in ne nariše ničesar, piko pa je
  // prilepil na levo os. Graf je bil videti prazen, čeprav je podatek bil.
  // Takrat postavimo točko na SREDINO: ena meritev ne pripada ne začetku ne
  // koncu obdobja.
  const enaTocka = data.length === 1;
  const xAt = (i: number) => (enaTocka ? innerW / 2 : i * stepX);

  const buildPath = (key: "views" | "visitors") => {
    return data
      .map((d, i) => {
        const x = xAt(i);
        const y = yScale(d[key]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  };

  // Area path = line path + close at bottom
  const areaPath = (() => {
    const linePath = buildPath("views");
    const lastX = xAt(data.length - 1);
    return `${linePath} L${lastX.toFixed(2)},${innerH} L0,${innerH} Z`;
  })();

  // X axis labels: prvi, sredinski, zadnji
  const xLabels = (() => {
    if (data.length <= 2) return data.map((d, i) => ({ i, label: d.date }));
    return [
      { i: 0, label: data[0].date },
      { i: Math.floor(data.length / 2), label: data[Math.floor(data.length / 2)].date },
      { i: data.length - 1, label: data[data.length - 1].date },
    ];
  })();

  // Y axis ticks: 0, max/2, max — dedup pri majhnih max-ih (1 → [0, 1])
  const yTicks = Array.from(new Set([0, Math.round(maxY / 2), maxY])).sort(
    (a, b) => a - b,
  );

  /**
   * Napis na osi iz ISO vrednosti.
   *
   * Zrno je razvidno iz dolžine: `2026-10-03` je dan, `2026-10-03T14` ura.
   * Neveljavne vrednosti vrnemo nespremenjene — na osi je bolje videti
   * surov podatek kot »Invalid Date«, ker prvo pove, kje iskati napako.
   */
  const formatDate = (iso: string) => {
    const jeUra = iso.length > 10;
    const d = new Date(jeUra ? `${iso}:00:00Z` : `${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return jeUra
      ? d.toLocaleTimeString("sl-SI", { hour: "2-digit", timeZone: "Europe/Ljubljana" })
      : d.toLocaleDateString("sl-SI", { day: "numeric", month: "short" });
  };

  return (
    // `dir="rtl"` na drsnem okviru pomeni, da se graf odpre pri ZADNJEM dnevu.
    // Prej se je odprl pri prvem: kdor je gledal na telefonu, je videl levo
    // tretjino — same ničle, ker se je promet zgodil zadnje dni — in sklepal,
    // da se graf ne izriše. Sam graf ostane od leve proti desni (`dir="ltr"`).
    <div dir="rtl" className="w-full overflow-x-auto">
      {/* `min-w` na telefonu: brez nje se `w-full` graf stisne v širino
          zaslona in črte, oznake in dnevi se zlijejo v kašo — `overflow-x-auto`
          nima česa drsati, ker nič ne štrli čez. S stalno najmanjšo širino
          graf ostane berljiv in se ga premakne s prstom. Od `sm` se spet
          prilagodi širini stolpca. */}
      <svg
        style={{ direction: "ltr" }}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full max-sm:min-w-[34rem]"
        role="img"
        aria-label="Promet skozi čas"
      >
        <defs>
          <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
          {/* Y grid + tick labels */}
          {yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <g key={tick}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeOpacity={0.4}
                  strokeDasharray={tick === 0 ? undefined : "2 4"}
                />
                <text
                  x={-8}
                  y={y}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--text-muted)"
                  fontFamily="ui-monospace, monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* ČRTE IN PLOSKEV SAMO, KADAR JE KAJ POVEZOVATI. Pri eni točki je
              ploskev »od točke do dna in do levega roba« narisala trikotnik,
              ki je izgledal kot strma rast — podatka za rast pa ni bilo.
              Izmišljena oblika je slabša od prazne: po njej se odloča. */}
          {!enaTocka ? (
            <>
              {/* Area pod views črto */}
              <path d={areaPath} fill="url(#trafficGradient)" />

              {/* Visitors črta (success) — ozadenjska */}
              <path
                d={buildPath("visitors")}
                fill="none"
                stroke="var(--success)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="4 3"
              />

              {/* Views črta (accent) — primarna */}
              <path
                d={buildPath("views")}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          ) : null}

          {/* Data points (dot na vsakem) */}
          {data.map((d, i) => {
            const x = xAt(i);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={yScale(d.views)}
                  r={enaTocka ? 5 : 3}
                  fill="var(--accent)"
                />
              </g>
            );
          })}

          {/* X axis labels */}
          {xLabels.map(({ i, label }) => {
            const x = xAt(i);
            return (
              <text
                key={i}
                x={x}
                y={innerH + 20}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fontSize={10}
                fill="var(--text-muted)"
                fontFamily="ui-monospace, monospace"
              >
                {formatDate(label)}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Legenda */}
      <div className="type-small mt-3 flex items-center justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="bg-accent inline-block h-2 w-3 rounded-sm" />
          <span className="text-muted">{viewsLabel}</span>
          <span className="text-text font-semibold tabular-nums">
            {data.reduce((s, d) => s + d.views, 0)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="bg-success inline-block h-0.5 w-3 rounded-sm"
            style={{ borderTop: "2px dashed var(--success)" }}
          />
          <span className="text-muted">{visitorsLabel}</span>
          <span className="text-text font-semibold tabular-nums">
            {Math.max(...data.map((d) => d.visitors), 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
