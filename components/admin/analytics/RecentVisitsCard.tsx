import { Inbox, Monitor, Smartphone, Tablet } from "lucide-react";

import type { RecentVisit } from "@/lib/analytics/queries";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * `<RecentVisitsCard />` — feed zadnjih ogledov strani (path, država,
 * naprava, relativni čas). Server-rendered; vsebina gre DIREKTNO v
 * AdminSection (analytics pattern, brez AdminSubSection wrapper-ja).
 *
 * Zasebnost: prikažemo samo agregatne dimenzije (država / tip naprave) —
 * nikoli IP, anonId ali user-agent string.
 */

type Labels = {
  empty: string;
  unknownCountry: string;
  justNow: string;
};

type Props = {
  visits: RecentVisit[];
  locale: string;
  labels: Labels;
};

function normalizeCountryCode(raw: string | null | undefined): string | null {
  const v = raw?.trim().toUpperCase();
  if (!v || !/^[A-Z]{2}$/.test(v)) return null;
  return v;
}

function formatRelative(date: Date, locale: string, justNow: string): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  if (Math.abs(diffSec) < 45) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

function DeviceIcon({ device }: { device: string | null }) {
  const cls = "text-subtle h-3.5 w-3.5 shrink-0";
  if (device === "mobile") return <Smartphone className={cls} aria-hidden />;
  if (device === "tablet") return <Tablet className={cls} aria-hidden />;
  return <Monitor className={cls} aria-hidden />;
}

export function RecentVisitsCard({ visits, locale, labels }: Props) {
  if (visits.length === 0) {
    return (
      <div className="text-muted type-small flex flex-col items-center justify-center gap-2 py-6">
        <Inbox className="text-subtle h-5 w-5" aria-hidden />
        <span>{labels.empty}</span>
      </div>
    );
  }

  return (
    <ol className="divide-border/60 flex flex-col divide-y" role="list">
      {visits.map((v) => {
        const code = normalizeCountryCode(v.country);
        const countryName = code ? getCountryName(code, locale) : labels.unknownCountry;
        return (
          <li
            key={v.id}
            className="type-small flex items-center gap-3 py-2 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden
              className="type-body w-6 shrink-0 text-center leading-none"
            >
              {code ? getCountryFlag(code) : "🌐"}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-text type-small truncate font-mono">{v.path}</span>
              <span className="text-subtle type-small flex items-center gap-1.5">
                <span className="truncate">{countryName}</span>
                {v.referrer ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{v.referrer}</span>
                  </>
                ) : null}
              </span>
            </div>
            <DeviceIcon device={v.device} />
            <time
              dateTime={v.visitedAt.toISOString()}
              className={cn("text-subtle type-small shrink-0 tabular-nums")}
            >
              {formatRelative(v.visitedAt, locale, labels.justNow)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
