import { DeviceDonut, type DonutSlice } from "@/components/admin/analytics/DeviceDonut";
import { cn } from "@/lib/utils";

/**
 * `<DonutBreakdownCard />` — kartica z eyebrow naslovom + `DeviceDonut`
 * (tortni diagram + legenda z deleži). Uporabljena za "Naprave" in
 * "Brskalniki" na `/admin`. Server-rendered.
 */
type Props = {
  title: string;
  slices: DonutSlice[];
  /** Vsota v sredini diagrama. */
  centerValue?: number | string;
  /** Kratek label pod vsoto (npr. "obiskovalcev"). */
  centerLabel?: string;
  emptyText: string;
  className?: string;
};

export function DonutBreakdownCard({
  title,
  slices,
  centerValue,
  centerLabel,
  emptyText,
  className,
}: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return (
    <div
      className={cn(
        "bg-surface flex h-full flex-col rounded-2xl p-5 shadow-(--shadow-card) sm:p-6",
        className,
      )}
    >
      <h3 className="text-subtle type-eyebrow mb-4 font-semibold">{title}</h3>
      {total === 0 ? (
        <p className="text-subtle type-small py-6 text-center">{emptyText}</p>
      ) : (
        <DeviceDonut
          slices={slices}
          centerValue={centerValue}
          centerLabel={centerLabel}
        />
      )}
    </div>
  );
}
