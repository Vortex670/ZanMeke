import {
  CalendarCheck,
  CalendarDays,
  Eye,
  MessageSquare,
  Send,
  Tags,
  UtensilsCrossed,
  type LucideIcon,
  Phone,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * `<ConversionFunnel />` — vertical funnel chart, ki pokaže pretok
 * obiskovalcev skozi conversion stopnje:
 *
 *   Ogledi strani  →  Ogledi jedilnika  →  Oddane rezervacije  →  Potrjene
 *
 * Vsaka stopnja je horizontal bar, katerega širina je proporcionalna
 * count-u glede na top-of-funnel (page views = 100%). Pod barom je
 * conversion rate (% relative na prejšnjo stopnjo).
 *
 * Server-rendered, brez JS.
 */

// Ključi so SKUPNI ZA VSE STRANI: gostilnica ima jedilnik in rezervacije,
// zanmeke.com ponudbo in povpraševanje. Komponenta ostane ena — doda se
// ključ, ne nova komponenta, sicer se lijaka na dveh straneh razideta.
type FunnelStage = {
  key:
    | "pageViews"
    | "menuViews"
    | "reservations"
    | "confirmed"
    | "offerViews"
    | "contactViews"
    | "calls"
    | "inquiries";
  label: string;
  value: number;
};

type Props = {
  stages: FunnelStage[];
  /** I18n za "{rate} pretvorbe iz prejšnje stopnje" (rate že vsebuje "%"). */
  formatConversion?: (rate: string) => string;
};

// Ikone stopenj imajo ENAKO obliko (prosojen krog z obročem) in se ločijo
// samo po barvi, ki ustreza barvi napredovalne črte pod njo. Prej so bili
// štirje polni krogi (moder, zelen, oranžen in BEL) — beli je na temni
// kartici izstopal kot tujek.
const STAGE_META: Record<FunnelStage["key"], { Icon: LucideIcon; tone: string }> = {
  pageViews: { Icon: Eye, tone: "bg-accent/15 text-accent ring-accent/25" },
  menuViews: {
    Icon: UtensilsCrossed,
    tone: "bg-success/15 text-success ring-success/25",
  },
  reservations: {
    Icon: CalendarDays,
    tone: "bg-warning/15 text-warning ring-warning/25",
  },
  confirmed: { Icon: CalendarCheck, tone: "bg-text/10 text-text ring-text/20" },
  offerViews: { Icon: Tags, tone: "bg-success/15 text-success ring-success/25" },
  contactViews: {
    Icon: MessageSquare,
    tone: "bg-warning/15 text-warning ring-warning/25",
  },
  calls: { Icon: Phone, tone: "bg-accent/15 text-accent ring-accent/25" },
  inquiries: { Icon: Send, tone: "bg-text/10 text-text ring-text/20" },
};

export function ConversionFunnel({ stages, formatConversion }: Props) {
  const conversionText =
    formatConversion ?? ((rate: string) => `${rate} pretvorbe iz prejšnje stopnje`);
  const top = Math.max(stages[0]?.value ?? 1, 1);

  return (
    <ol className="flex flex-col gap-3" role="list">
      {stages.map((stage, idx) => {
        const meta = STAGE_META[stage.key];
        const Icon = meta.Icon;
        const widthPct = Math.max((stage.value / top) * 100, 4);

        // Conversion rate vs prejšnji
        const prev = idx > 0 ? stages[idx - 1].value : null;
        const conversionRate =
          prev && prev > 0 ? `${((stage.value / prev) * 100).toFixed(1)}%` : null;

        return (
          <li key={stage.key} className="flex items-center gap-4">
            <IconCircle tone="none" size="sm" className={cn("ring-1", meta.tone)}>
              <Icon className="h-4 w-4" />
            </IconCircle>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-text type-small font-semibold">{stage.label}</p>
                <p className="text-text type-h3 font-medium tabular-nums">
                  {stage.value}
                </p>
              </div>
              <div className="bg-text/10 h-2 overflow-hidden rounded-full" aria-hidden>
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    idx === 0 && "bg-accent",
                    idx === 1 && "bg-success",
                    idx === 2 && "bg-warning",
                    idx === 3 && "bg-text",
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {conversionRate ? (
                <p className="text-subtle type-small">{conversionText(conversionRate)}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
