import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Analitika — ISTI API kot na gostilnica-plus.si in second-home.hr
// ----------------------------------------------------------------------------
// Imena tipov in funkcij so namenoma enaka kot tam (`RangeKey`,
// `getDashboardSnapshot`, `pctDelta` …), ker iste komponente na vseh treh
// straneh berejo iste oblike podatkov. Tabele spodaj so zanmeke.com (obiski,
// ogledi, povpraševanja) — kar se razlikuje med stranmi, je VSEBINA, ne
// vmesnik.
//
// Brez zunanjih sledilcev: vse številke so iz lastne baze, zato tudi ni
// pasice za soglasje, ki bi stala med obiskovalcem in telefonsko številko.
// ============================================================================

export type RangeKey = "24h" | "7d" | "30d" | "90d" | "365d";

type WithShare = { share: number };

/** Mere vpetosti — isti nabor kot na drugih dveh straneh. */
type EngagementKpi = {
  /** % obiskov z natanko enim ogledom. `null` = ni obiskov. */
  bounceRate: number | null;
  /** Povprečje ogledov na obisk. */
  pagesPerSession: number | null;
  /** Povprečno trajanje obiska v sekundah (obisk z enim ogledom šteje 0 s). */
  avgSessionDurationSec: number | null;
  /** Povprečen čas na strani — razmik med zaporednima ogledoma v obisku. */
  avgTimeOnPageSec: number | null;
};

type DashboardSnapshot = {
  range: RangeKey;
  rangeStart: Date;
  rangeEnd: Date;

  pageViewsTotal: number;
  pageViewsPrevious: number;
  visitorsTotal: number;
  visitorsPrevious: number;
  sessionsTotal: number;
  sessionsPrevious: number;
  engagement: EngagementKpi;
  engagementPrevious: EngagementKpi;

  /** Povpraševanja z obrazca — edino, kar na tej strani šteje kot izid. */
  contactsTotal: number;
  /** Kliki na telefonsko številko — dejanje, ki ga stran največkrat sproži. */
  callsTotal: number;
  contactsPrevious: number;

  daily: Array<{ date: string; views: number; visitors: number }>;
  hourly: Array<{ dow: number; hour: number; views: number }>;

  topPages: Array<{ path: string; views: number } & WithShare>;
  topReferrers: Array<{ referrer: string; sessions: number } & WithShare>;
  deviceBreakdown: Array<{ device: string; visitors: number } & WithShare>;
  browserBreakdown: Array<{ browser: string; visitors: number } & WithShare>;
};

const DNI: Record<RangeKey, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export function getRangeStart(range: RangeKey, now: Date = new Date()): Date {
  return new Date(now.getTime() - DNI[range] * 86_400_000);
}

/**
 * Sprememba v odstotkih.
 *
 * `null` pomeni »ni primerjave« in se izriše kot pomišljaj — ne kot 0 %.
 * Rast z nič na pet ni »plus neskončno«, ampak podatek, ki ga odstotek ne
 * zna povedati.
 */
export function pctDelta(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null) return null;
  if (prev === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prev) / prev) * 100);
}

/** Iz naslova vira vzamemo gostitelja; cela pot je v seznamu neberljiva. */
export function normalizeReferrer(raw: string | null): string {
  if (!raw) return "neposredno";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

/** Kdo je na strani v tem trenutku (zadnjih pet minut). */
export async function getLiveVisitorsCount(now: Date = new Date()): Promise<number> {
  const od = new Date(now.getTime() - 5 * 60_000);
  const vrstice = await prisma.ogledStrani.findMany({
    where: { createdAt: { gte: od } },
    select: { obisk: { select: { obiskovalecId: true } } },
  });
  return new Set(vrstice.map((v) => v.obisk.obiskovalecId)).size;
}

export type RecentVisit = {
  id: string;
  path: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  visitedAt: Date;
};

export async function getRecentVisits(limit = 20): Promise<RecentVisit[]> {
  const vrstice = await prisma.ogledStrani.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pot: true,
      createdAt: true,
      obisk: {
        select: {
          vir: true,
          obiskovalec: { select: { drzava: true, naprava: true } },
        },
      },
    },
  });

  return vrstice.map((v) => ({
    id: v.id,
    path: v.pot,
    referrer: v.obisk.vir,
    country: v.obisk.obiskovalec.drzava,
    device: v.obisk.obiskovalec.naprava,
    visitedAt: v.createdAt,
  }));
}

type TodayKpi = { pageViews: number; visitors: number };

/** Danes od polnoči po ljubljanskem času — ne zadnjih 24 ur. */
export async function getTodayKpi(now: Date = new Date()): Promise<TodayKpi> {
  const danes = new Date(
    new Date(now.toLocaleString("en-US", { timeZone: "Europe/Ljubljana" })).setHours(
      0,
      0,
      0,
      0,
    ),
  );

  const [pageViews, obiski] = await Promise.all([
    prisma.ogledStrani.count({ where: { createdAt: { gte: danes } } }),
    prisma.ogledStrani.findMany({
      where: { createdAt: { gte: danes } },
      select: { obisk: { select: { obiskovalecId: true } } },
    }),
  ]);

  return {
    pageViews,
    visitors: new Set(obiski.map((o) => o.obisk.obiskovalecId)).size,
  };
}

/** Prva stran obiska — pove, kje ljudje na stran vstopijo. */
export async function getTopLandingPages(
  range: RangeKey,
  limit = 8,
): Promise<Array<{ path: string; sessions: number } & WithShare>> {
  const od = getRangeStart(range);
  const vrstice = await prisma.obisk.groupBy({
    by: ["vstopnaPot"],
    where: { zacetek: { gte: od }, vstopnaPot: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { vstopnaPot: "desc" } },
    take: limit,
  });

  const skupaj = vrstice.reduce((v, r) => v + r._count._all, 0);
  return vrstice.map((r) => ({
    path: r.vstopnaPot ?? "/",
    sessions: r._count._all,
    // V odstotkih — glej opombo pri `delez` spodaj.
    share: skupaj === 0 ? 0 : Math.round((r._count._all / skupaj) * 100),
  }));
}

/** Ogledi po dnevu v tednu in uri — za toplotno karto. */
export async function getActivityHeatmap(
  days = 90,
): Promise<Array<{ dow: number; hour: number; views: number }>> {
  const od = new Date(Date.now() - days * 86_400_000);
  const vrstice = await prisma.$queryRaw<
    Array<{ dow: number; hour: number; views: bigint }>
  >`
    SELECT EXTRACT(DOW FROM "createdAt" AT TIME ZONE 'Europe/Ljubljana')::int AS dow,
           EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Europe/Ljubljana')::int AS hour,
           COUNT(*)::bigint AS views
    FROM "ogledi_strani"
    WHERE "createdAt" >= ${od}
    GROUP BY 1, 2
  `;

  // Postgres šteje nedeljo kot 0, naša karta pa se začne s ponedeljkom.
  return vrstice.map((v) => ({
    dow: (v.dow + 6) % 7,
    hour: v.hour,
    views: Number(v.views),
  }));
}

/** Mere vpetosti za eno časovno okno — vse v enem prehodu čez obiske. */
async function engagement(od: Date, do_: Date): Promise<EngagementKpi> {
  const vrstice = await prisma.$queryRaw<
    Array<{ ogledi: bigint; trajanje: number | null }>
  >`
    SELECT COUNT(*)::bigint AS ogledi,
           EXTRACT(EPOCH FROM (MAX(o."createdAt") - MIN(o."createdAt")))::float AS trajanje
    FROM "ogledi_strani" o
    WHERE o."createdAt" >= ${od} AND o."createdAt" < ${do_}
    GROUP BY o."obiskId"
  `;

  if (vrstice.length === 0) {
    return {
      bounceRate: null,
      pagesPerSession: null,
      avgSessionDurationSec: null,
      avgTimeOnPageSec: null,
    };
  }

  const obiskov = vrstice.length;
  const ogledov = vrstice.reduce((v, r) => v + Number(r.ogledi), 0);
  const odbitih = vrstice.filter((r) => Number(r.ogledi) === 1).length;
  const trajanje = vrstice.reduce((v, r) => v + (r.trajanje ?? 0), 0);
  // Zadnji ogled obiska nima naslednika, zato se ne šteje — tako kot pri
  // Googlovi analitiki; drugače je povprečni čas na strani vedno prenizek.
  const razmikov = ogledov - obiskov;

  return {
    bounceRate: Math.round((odbitih / obiskov) * 100),
    pagesPerSession: Math.round((ogledov / obiskov) * 10) / 10,
    avgSessionDurationSec: Math.round(trajanje / obiskov),
    avgTimeOnPageSec: razmikov > 0 ? Math.round(trajanje / razmikov) : null,
  };
}

export async function getDashboardSnapshot(
  range: RangeKey,
  now: Date = new Date(),
): Promise<DashboardSnapshot> {
  const od = getRangeStart(range, now);
  const odPrej = new Date(od.getTime() - DNI[range] * 86_400_000);
  const zrno = range === "24h" ? "hour" : "day";

  const vOknu = { gte: od };
  const vPrejsnjem = { gte: odPrej, lt: od };

  const [
    pageViewsTotal,
    pageViewsPrevious,
    sessionsTotal,
    sessionsPrevious,
    visitorsTotal,
    visitorsPrevious,
    contactsTotal,
    contactsPrevious,
    callsTotal,
    eng,
    engPrej,
    strani,
    viri,
    naprave,
    brskalniki,
    dailyRaw,
    hourly,
  ] = await Promise.all([
    prisma.ogledStrani.count({ where: { createdAt: vOknu } }),
    prisma.ogledStrani.count({ where: { createdAt: vPrejsnjem } }),
    prisma.obisk.count({ where: { zacetek: vOknu } }),
    prisma.obisk.count({ where: { zacetek: vPrejsnjem } }),
    prisma.obiskovalec.count({ where: { zadnjiObisk: vOknu } }),
    prisma.obiskovalec.count({ where: { zadnjiObisk: vPrejsnjem } }),
    prisma.sporocilo.count({ where: { createdAt: vOknu } }),
    prisma.sporocilo.count({ where: { createdAt: vPrejsnjem } }),
    prisma.dogodek.count({ where: { ime: "klic", createdAt: vOknu } }),
    engagement(od, now),
    engagement(odPrej, od),

    prisma.ogledStrani.groupBy({
      by: ["pot"],
      where: { createdAt: vOknu },
      _count: { _all: true },
      orderBy: { _count: { pot: "desc" } },
      take: 8,
    }),
    prisma.obisk.groupBy({
      by: ["vir"],
      where: { zacetek: vOknu },
      _count: { _all: true },
      orderBy: { _count: { vir: "desc" } },
      take: 8,
    }),
    prisma.obiskovalec.groupBy({
      by: ["naprava"],
      where: { zadnjiObisk: vOknu },
      _count: { _all: true },
    }),
    prisma.obiskovalec.groupBy({
      by: ["brskalnik"],
      where: { zadnjiObisk: vOknu },
      _count: { _all: true },
    }),

    prisma.$queryRawUnsafe<Array<{ kdaj: Date; views: bigint; visitors: bigint }>>(
      `
      SELECT date_trunc('${zrno}', o."createdAt" AT TIME ZONE 'Europe/Ljubljana') AS kdaj,
             COUNT(*)::bigint AS views,
             COUNT(DISTINCT b."obiskovalecId")::bigint AS visitors
      FROM "ogledi_strani" o
      JOIN "obiski" b ON b.id = o."obiskId"
      WHERE o."createdAt" >= $1
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      od,
    ),
    getActivityHeatmap(DNI[range]),
  ]);

  // DELEŽ JE V ODSTOTKIH (0–100), ne v razmerju (0–1).
  //
  // `BreakdownCard` je skupna komponenta vseh treh strani: širino črte računa
  // kot `share / maxShare`, napis pa izpiše kot »{share} %«. Z razmerjem je
  // pisalo »0.4444444444 %«, besedilo se je prelilo čez črto in deleži so bili
  // videti kot stotinka tega, kar so v resnici.
  const delez = <T>(vrstice: T[], stevilo: (v: T) => number) => {
    const skupaj = vrstice.reduce((v, r) => v + stevilo(r), 0);
    return (r: T) => (skupaj === 0 ? 0 : Math.round((stevilo(r) / skupaj) * 100));
  };

  const dStrani = delez(strani, (r) => r._count._all);
  // VIRE JE TREBA SEŠTETI PO GOSTITELJU, ne po surovem naslovu.
  //
  // `groupBy` v bazi združi po celem naslovu, zato so `http://localhost:3000/`,
  // `http://localhost:3000/ponudba` in `http://localhost:3000/dela` tri
  // ločene vrstice — po `normalizeReferrer` pa vse tri »localhost«. Posledici
  // sta bili dve: v seznamu se je isti vir pojavil trikrat z razbitimi
  // števili, React pa je javil dva otroka z istim ključem.
  //
  // Seštevanje mora biti TU in ne v komponenti: delež se računa iz vsote, in
  // če se vrstice združijo šele ob izrisu, so odstotki napačni.
  const viriPoGostitelju = [
    ...viri
      .reduce((zemljevid, r) => {
        const kljuc = normalizeReferrer(r.vir);
        zemljevid.set(kljuc, (zemljevid.get(kljuc) ?? 0) + r._count._all);
        return zemljevid;
      }, new Map<string, number>())
      .entries(),
  ]
    .map(([referrer, sessions]) => ({ referrer, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  const dViri = delez(viriPoGostitelju, (r) => r.sessions);
  const dNaprave = delez(naprave, (r) => r._count._all);
  const dBrskalniki = delez(brskalniki, (r) => r._count._all);

  /**
   * Os grafa dobi ISO in NE oblikovanega niza.
   *
   * Tu je bil `Intl.DateTimeFormat`, ki je vračal »3. 10.«; graf pa iz te
   * vrednosti sestavi `new Date("3. 10.T00:00:00Z")` in dobi `Invalid Date`.
   * Na osi je pisalo točno to. Oblikovanje je naloga grafa, ki edini ve,
   * koliko prostora ima za napis — poizvedba vrne podatek.
   *
   * `date_trunc(... AT TIME ZONE 'Europe/Ljubljana')` vrne krajevni čas kot
   * časovni žig brez cone, gonilnik pa ga poda kot `Date` v UTC. Zato je
   * `toISOString()` tu PRAVI dan in ne dan prej.
   */
  const vIso = (d: Date) =>
    zrno === "hour" ? d.toISOString().slice(0, 13) : d.toISOString().slice(0, 10);

  return {
    range,
    rangeStart: od,
    rangeEnd: now,

    pageViewsTotal,
    pageViewsPrevious,
    visitorsTotal,
    visitorsPrevious,
    sessionsTotal,
    sessionsPrevious,
    engagement: eng,
    engagementPrevious: engPrej,
    contactsTotal,
    contactsPrevious,
    callsTotal,

    daily: dailyRaw.map((v) => ({
      date: vIso(new Date(v.kdaj)),
      views: Number(v.views),
      visitors: Number(v.visitors),
    })),
    hourly,

    topPages: strani.map((r) => ({
      path: r.pot,
      views: r._count._all,
      share: dStrani(r),
    })),
    topReferrers: viriPoGostitelju.map((r) => ({
      ...r,
      share: dViri(r),
    })),
    deviceBreakdown: naprave.map((r) => ({
      device: r.naprava ?? "neznano",
      visitors: r._count._all,
      share: dNaprave(r),
    })),
    browserBreakdown: brskalniki.map((r) => ({
      browser: r.brskalnik ?? "Drugo",
      visitors: r._count._all,
      share: dBrskalniki(r),
    })),
  };
}
