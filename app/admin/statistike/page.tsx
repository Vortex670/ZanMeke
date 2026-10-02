import {
  Activity,
  Clock,
  Eye,
  Filter,
  Footprints,
  Gauge,
  Layers,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { ActivityHeatmap } from "@/components/admin/analytics/ActivityHeatmap";
import {
  BreakdownCard,
  type BreakdownRow,
} from "@/components/admin/analytics/BreakdownCard";
import { ConversionFunnel } from "@/components/admin/analytics/ConversionFunnel";
import type { DonutSlice, DonutTone } from "@/components/admin/analytics/DeviceDonut";
import { DonutBreakdownCard } from "@/components/admin/analytics/DonutBreakdownCard";
import { RecentVisitsCard } from "@/components/admin/analytics/RecentVisitsCard";
import { TrafficLineChart } from "@/components/admin/analytics/TrafficLineChart";
import { SectionHeader } from "@/components/admin/kit/SectionHeader";
import { StatCard } from "@/components/admin/kit/StatCard";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { PonastaviStatistiko } from "@/components/admin/statistike/PonastaviStatistiko";
import {
  TimeRangeChips,
  type TimeRangeValue,
} from "@/components/admin/statistike/TimeRangeChips";
import {
  getActivityHeatmap,
  getDashboardSnapshot,
  getLiveVisitorsCount,
  getRecentVisits,
  getTodayKpi,
  getTopLandingPages,
  pctDelta,
  type RangeKey,
} from "@/lib/analytics/queries";
import { cn } from "@/lib/utils";

// ============================================================================
// /admin/statistike — analitika obiska
// ----------------------------------------------------------------------------
// ISTI NABOR IN VRSTNI RED ODSEKOV kot na gostilnica-plus.si in
// second-home.hr, iz istih komponent (`SectionHeader`, `StatCard`,
// `TrafficLineChart`, `ConversionFunnel`, `DonutBreakdownCard`,
// `BreakdownCard`, `ActivityHeatmap`, `RecentVisitsCard`). Razlikuje se
// samo lijak, ker je pri vsaki strani izid drug: tu je to povpraševanje.
//
// Pregled (/admin) pove, kaj je za narediti danes. Tu so trendi in
// primerjave.
//
// ?obdobje=24h | 7d | 30d | 90d | 365d (privzeto 7d)
// ============================================================================

export const dynamic = "force-dynamic";

const VELJAVNA: RangeKey[] = ["24h", "7d", "30d", "90d", "365d"];

const OBDOBJE: Record<RangeKey, string> = {
  "24h": "zadnjih 24 ur",
  "7d": "zadnjih 7 dni",
  "30d": "zadnjih 30 dni",
  "90d": "zadnjih 90 dni",
  "365d": "zadnje leto",
};

const BRSKALNIK_TONI: DonutTone[] = [
  "accent",
  "success",
  "warning",
  "accent2",
  "muted",
  "neutral",
];

const stevilo = new Intl.NumberFormat("sl-SI");

/** Sekunde → »1m 23s« / »45s« / »—«. */
function trajanje(sec: number | null): string {
  if (sec === null || sec === 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/** Lupina za vizualizacije — ista kot StatCard/BreakdownCard. */
function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface rounded-2xl p-5 shadow-(--shadow-card) sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default async function Statistike({
  searchParams,
}: {
  searchParams: Promise<{ obdobje?: string }>;
}) {
  const sp = await searchParams;
  const range: RangeKey = (VELJAVNA as string[]).includes(sp.obdobje ?? "")
    ? (sp.obdobje as RangeKey)
    : "7d";
  const obdobje = OBDOBJE[range];

  // Vsaka poizvedba ima svoj `catch` — napaka ene ne podre strani.
  const [posnetek, danes, zivi, zadnji, karta, vstopne] = await Promise.all([
    getDashboardSnapshot(range),
    getTodayKpi().catch(() => ({ pageViews: 0, visitors: 0 })),
    getLiveVisitorsCount().catch(() => 0),
    getRecentVisits(20).catch(() => []),
    getActivityHeatmap(90).catch(() => []),
    getTopLandingPages(range, 8).catch(() => []),
  ]);

  const deltaOgledi = pctDelta(posnetek.pageViewsTotal, posnetek.pageViewsPrevious);
  const deltaObiskovalci = pctDelta(posnetek.visitorsTotal, posnetek.visitorsPrevious);
  const deltaPovprasevanja = pctDelta(posnetek.contactsTotal, posnetek.contactsPrevious);
  const deltaSeja = pctDelta(
    posnetek.engagement.avgSessionDurationSec,
    posnetek.engagementPrevious.avgSessionDurationSec,
  );

  // ── Kolobarja: naprave (stalni toni) + brskalniki (prvih 5 + »Drugo«) ──
  const napraveMeta: Record<string, DonutTone> = {
    računalnik: "accent",
    telefon: "success",
    tablica: "warning",
  };
  const napraveSlices: DonutSlice[] = posnetek.deviceBreakdown
    .map((r) => ({
      label: r.device.charAt(0).toUpperCase() + r.device.slice(1),
      value: r.visitors,
      tone: napraveMeta[r.device] ?? ("neutral" as const),
    }))
    .filter((s) => s.value > 0);

  const brskalniki = [...posnetek.browserBreakdown].sort(
    (a, b) => b.visitors - a.visitors,
  );
  const brskalnikiSlices: DonutSlice[] = brskalniki.slice(0, 5).map((r, i) => ({
    label: r.browser,
    value: r.visitors,
    tone: BRSKALNIK_TONI[i] ?? "neutral",
  }));
  const ostali = brskalniki.slice(5).reduce((v, r) => v + r.visitors, 0);
  if (ostali > 0)
    brskalnikiSlices.push({ label: "Drugo", value: ostali, tone: "neutral" });

  // ── Razčlenitev 2×2 ──
  const straniRows: BreakdownRow[] = posnetek.topPages.map((p) => ({
    key: p.path,
    label: <span className="type-small font-mono">{p.path}</span>,
    value: p.views,
    share: p.share,
  }));
  const vstopneRows: BreakdownRow[] = vstopne.map((l) => ({
    key: l.path,
    label: <span className="type-small font-mono">{l.path}</span>,
    value: l.sessions,
    share: l.share,
  }));
  const viriRows: BreakdownRow[] = posnetek.topReferrers.map((r) => ({
    key: r.referrer,
    value: r.sessions,
    share: r.share,
  }));

  // Lijak: od ogleda do povpraševanja. Vmesni stopnji sta strani, ki ju
  // človek odpre, preden napiše — ponudba in kontakt.
  const ogledovPonudbe = posnetek.topPages.find((p) => p.path === "/ponudba")?.views ?? 0;
  const ogledovKontakta =
    posnetek.topPages.find((p) => p.path === "/kontakt")?.views ?? 0;

  const deltaNapis = `vs. prejšnjih ${obdobje.replace("zadnjih ", "").replace("zadnje ", "")}`;

  return (
    <AdminPage
      eyebrow={`Statistike · ${obdobje}`}
      title="Kaj se dogaja na strani"
      description="Promet, naprave in pot do povpraševanja. Vse številke so z našega strežnika — brez zunanjih sledilcev."
      actions={
        <div className="flex flex-wrap items-center gap-(--s2)">
          <TimeRangeChips
            current={range as TimeRangeValue}
            ariaLabel="Izbira obdobja"
            options={[
              { value: "24h", label: "24 ur" },
              { value: "7d", label: "7 dni" },
              { value: "30d", label: "30 dni" },
              { value: "90d", label: "90 dni" },
              { value: "365d", label: "Leto" },
            ]}
          />
          {/* Ob izbiri obdobja, ker se tiče istih številk. */}
          <PonastaviStatistiko />
        </div>
      }
    >
      {/* ── 1 · Ključne številke ──────────────────────────────────────── */}
      <SectionHeader
        icon={<Gauge className="h-5 w-5" aria-hidden />}
        title="Ključne številke"
        description={`Promet za ${obdobje} v primerjavi s prejšnjim enako dolgim obdobjem.`}
      />
      <div className="mt-(--s2) grid grid-cols-2 gap-(--s2) lg:grid-cols-4">
        <StatCard
          label="Ogledi strani"
          value={stevilo.format(posnetek.pageViewsTotal)}
          icon={<Eye strokeWidth={1.8} aria-hidden />}
          delta={deltaOgledi}
          deltaLabel={deltaNapis}
          hint={`Danes ${stevilo.format(danes.pageViews)}`}
        />
        <StatCard
          label="Obiskovalci"
          value={stevilo.format(posnetek.visitorsTotal)}
          icon={<Users strokeWidth={1.8} aria-hidden />}
          delta={deltaObiskovalci}
          deltaLabel={deltaNapis}
          live={zivi > 0}
          hint={zivi > 0 ? `${zivi} zdaj na strani` : `Danes ${danes.visitors}`}
        />
        <StatCard
          label="Povpraševanja"
          value={stevilo.format(posnetek.contactsTotal)}
          icon={<Send strokeWidth={1.8} aria-hidden />}
          variant={posnetek.contactsTotal > 0 ? "accent" : "neutral"}
          delta={deltaPovprasevanja}
          deltaLabel={deltaNapis}
          hint="Edino, kar na tej strani res šteje"
          href="/admin/sporocila"
        />
        <StatCard
          label="Čas na strani"
          value={trajanje(posnetek.engagement.avgSessionDurationSec)}
          icon={<Clock strokeWidth={1.8} aria-hidden />}
          delta={deltaSeja}
          deltaLabel={deltaNapis}
          hint={`${posnetek.engagement.pagesPerSession ?? "—"} strani na obisk`}
        />
      </div>

      {/* ── 2 · Promet skozi čas ─────────────────────────────────────── */}
      <SectionHeader
        className="mt-(--s4)"
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
        title="Promet"
        description="Ogledi in obiskovalci po dnevih. Razmik med črtama pove, koliko strani si en človek pogleda."
      />
      <Panel className="mt-(--s2)">
        <TrafficLineChart
          data={posnetek.daily}
          viewsLabel="Ogledi"
          visitorsLabel="Obiskovalci"
        />
      </Panel>

      {/* ── 3 · Pot do povpraševanja ─────────────────────────────────── */}
      <SectionHeader
        className="mt-(--s4)"
        icon={<Footprints className="h-5 w-5" aria-hidden />}
        title="Pot do povpraševanja"
        description="Kje ljudje odpadejo. Največji padec pove, katero stran je treba popraviti."
      />
      <div className="mt-(--s2) grid gap-(--s2) lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <ConversionFunnel
            stages={[
              {
                key: "pageViews",
                label: "Ogledi strani",
                value: posnetek.pageViewsTotal,
              },
              { key: "offerViews", label: "Ogledi ponudbe", value: ogledovPonudbe },
              { key: "contactViews", label: "Odprt kontakt", value: ogledovKontakta },
              {
                key: "inquiries",
                label: "Oddano povpraševanje",
                value: posnetek.contactsTotal,
              },
            ]}
          />
        </Panel>
        <DonutBreakdownCard
          title="Naprave"
          slices={napraveSlices}
          centerValue={stevilo.format(posnetek.visitorsTotal)}
          centerLabel="obiskovalcev"
          emptyText="Ko bo prvi obisk, bo tu pisalo telefon ali računalnik."
        />
      </div>

      {/* ── 4 · Razčlenitev ──────────────────────────────────────────── */}
      <SectionHeader
        className="mt-(--s4)"
        icon={<Layers className="h-5 w-5" aria-hidden />}
        title="Razčlenitev"
        description="Katere strani gledajo, kje vstopijo in od kod pridejo."
      />
      <div className="mt-(--s2) grid gap-(--s2) lg:grid-cols-2">
        <BreakdownCard
          title="Najbolj obiskane strani"
          rows={straniRows}
          emptyText="Še ni ogledov. Ko kdo odpre stran, se pokaže tu."
        />
        <BreakdownCard
          title="Kje vstopijo"
          rows={vstopneRows}
          emptyText="Prva stran obiska se zapiše ob prvem ogledu."
        />
        <BreakdownCard
          title="Od kod pridejo"
          rows={viriRows}
          emptyText="Nihče še ni prišel po povezavi z druge strani."
        />
        <DonutBreakdownCard
          title="Brskalniki"
          slices={brskalnikiSlices}
          emptyText="Brskalnik se zapiše ob prvem obisku."
        />
      </div>

      {/* ── 5 · Kdaj so na strani ────────────────────────────────────── */}
      <SectionHeader
        className="mt-(--s4)"
        icon={<Activity className="h-5 w-5" aria-hidden />}
        title="Kdaj so na strani"
        description="Zadnjih 90 dni po dnevih in urah. Pove, kdaj se splača poslati pošto."
      />
      <Panel className="mt-(--s2)">
        <ActivityHeatmap data={karta} />
      </Panel>

      {/* ── 6 · Zadnji obiski ────────────────────────────────────────── */}
      <SectionHeader
        className="mt-(--s4)"
        icon={<Filter className="h-5 w-5" aria-hidden />}
        title="Zadnji obiski"
        description="Zadnjih dvajset ogledov — da se vidi, da stran res živi."
      />
      <div className="mt-(--s2)">
        <RecentVisitsCard
          visits={zadnji}
          locale="sl-SI"
          labels={{
            empty: "V tem obdobju ni zabeleženega nobenega ogleda.",
            unknownCountry: "Neznano",
            justNow: "pravkar",
          }}
        />
      </div>
    </AdminPage>
  );
}
