"use client";

import { Calendar, CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Helper: koraj derive { year, month } iz ISO datum string-a (ali "now").
function viewFromIso(iso: string): { year: number; month: number } {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) - 1 };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { HiddenField } from "@/components/ui/HiddenField";

// ============================================================================
// <DatePicker> — popover kalendar (NE native date input)
// ----------------------------------------------------------------------------
// API:
//   <DatePicker
//     name="shootDate"           // FormData (ISO YYYY-MM-DD)
//     value={shootDate}          // ISO string ALI ""
//     onValueChange={setShootDate}
//     placeholder="Izberi datum"
//   />
// ============================================================================

type Props = {
  name?: string;
  value: string; // ISO "YYYY-MM-DD" or ""
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  size?: "sm" | "md";
  className?: string;
  /** Min/max omejitev — opcijsko. ISO YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** Vrne true za datume, ki jih uporabnik ne sme izbrati (npr. zasedeni termini). */
  isDateDisabled?: (date: Date) => boolean;
  /** Oznaka BCP-47 za imena mesecev in dni (`sl-SI`, `hr-HR`, `de-DE`, `en-GB`). */
  locale?: string;
  /** Besedila — večjezična stran jih poda iz svojih prevodov. */
  labels?: {
    dialog?: string;
    prevMonth?: string;
    nextMonth?: string;
    today?: string;
    clear?: string;
  };
};

const DEFAULT_LABELS = {
  dialog: "Izberi datum",
  prevMonth: "Prejšnji mesec",
  nextMonth: "Naslednji mesec",
  today: "Danes",
  clear: "Počisti",
};

/**
 * Imena mesecev in začetnice dni pridejo iz `Intl` — ista datoteka zato dela
 * v slovenščini, hrvaščini, nemščini in angleščini, brez seznamov v kodi.
 * Teden se začne v ponedeljek (EU); pri `en-*` ostane ponedeljek namenoma,
 * da je mreža na vseh straneh admina enaka.
 */
function monthName(locale: string, year: number, month: number): string {
  const raw = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
  return raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1);
}

function weekdayInitials(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  // 2024-01-01 je ponedeljek.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2024, 0, 1 + i)).toLocaleUpperCase(locale),
  );
}

export function DatePicker({
  name,
  value,
  onValueChange,
  placeholder = "Izberi datum",
  disabled,
  invalid,
  id: idProp,
  size = "md",
  className,
  min,
  max,
  isDateDisabled,
  locale = "sl-SI",
  labels,
}: Props) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );
  const weekdays = useMemo(() => weekdayInitials(locale), [locale]);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const parsedValue = useMemo(() => parseISO(value), [value]);
  // ViewMonth uses key based on value — če se value spremeni, komponent se
  // remountajo z novim viewFromIso(value), kar je čisto brez setState v useEffect-u.
  // To je interno upravljano. (DatePicker se re-renderira normalno; ko user
  // klikne dan, mi neposredno spremenimo value in zapremo popover.)
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() =>
    viewFromIso(value),
  );

  // Popover gre skozi portal: znotraj kartice ali obrazca bi ga prekrila
  // naslednja ploskev — `AdminSection` in `AdminPanel` ustvarita svoj sklad
  // slojev, kjer `z-index` ne pomaga. Zato fiksni položaj, izmerjen ob
  // odprtju in ob vsakem drsenju.
  //
  // KAM gre, pa ni vedno `document.body`. Kadar sprožilec stoji v modalnem
  // oknu (`<dialog>` odprt s `showModal()`), je okno v TOP LAYER: vse, kar je
  // v `body`, se izriše POD njim, ne glede na `z-index`. Koledar je bil zato
  // v oknu za rezervacijo mize ves čas izrisan — 288 × 296 px na pravem
  // mestu —, samo skrit za oknom. Gost je kliknil polje z datumom in ni se
  // zgodilo nič, tudi za naslednji mesec ni mogel naprej.
  //
  // Zato: če je nad sprožilcem `<dialog>`, gre popover VANJ.
  const [pos, setPos] = useState<{ top: number; left: number; dropUp: boolean } | null>(
    null,
  );
  const [cilj, setCilj] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    // Najbližji `<dialog>` nad sprožilcem; sicer telo strani.
    setCilj(triggerRef.current?.closest("dialog") ?? document.body);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const belowSpace = window.innerHeight - r.bottom;
      const dropUp = belowSpace < 380 && r.top > belowSpace;
      // Na telefonu koledar zasede vso širino (`inset-x-2`), zato levega
      // roba ni treba računati — sicer bi ga postavil za 288 px široko
      // škatlo, ki je ni več.
      const sirokZaslon = window.innerWidth >= 640;
      const width = 288; // w-72
      const left = sirokZaslon
        ? Math.min(r.left, Math.max(8, window.innerWidth - width - 8))
        : 8;
      setPos({ top: dropUp ? r.top - 8 : r.bottom + 8, left, dropUp });
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      setPos(null);
    };
  }, [open]);

  // Escape zapre — isto kot klik izven.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(t) &&
        popoverRef.current &&
        !popoverRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openPicker = useCallback(() => {
    // Sync viewMonth iz trenutne value ob open-u (brez useEffect cascading).
    setViewMonth(viewFromIso(value));
    setOpen(true);
  }, [value]);

  const select = useCallback(
    (year: number, month: number, day: number) => {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onValueChange(iso);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onValueChange],
  );

  const clear = useCallback(() => {
    onValueChange("");
    setOpen(false);
    triggerRef.current?.focus();
  }, [onValueChange]);

  const goToToday = useCallback(() => {
    const now = new Date();
    select(now.getFullYear(), now.getMonth(), now.getDate());
  }, [select]);

  // Kalendar grid — Pon-Ned (Slovenija)
  const daysGrid = useMemo(() => {
    const { year, month } = viewMonth;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    // ISO weekday: pon=0..ned=6
    const firstDayIdx = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < firstDayIdx; i++)
      cells.push({ date: null, isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // pad na 6 vrstic × 7 = 42
    while (cells.length < 42) cells.push({ date: null, isCurrentMonth: false });

    return cells;
  }, [viewMonth]);

  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const isOutOfRange = useCallback(
    (d: Date) => {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      if (isDateDisabled && isDateDisabled(d)) return true;
      return false;
    },
    [minDate, maxDate, isDateDisabled],
  );

  const SIZE_CLASSES = {
    sm: "h-9 type-small",
    md: "h-12 type-body",
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const isSelected = (d: Date) =>
    parsedValue !== null &&
    d.getFullYear() === parsedValue.getFullYear() &&
    d.getMonth() === parsedValue.getMonth() &&
    d.getDate() === parsedValue.getDate();

  return (
    <div className={cn("relative", className)}>
      {name ? <HiddenField name={name} value={value} /> : null}

      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        id={id}
        disabled={disabled}
        data-invalid={invalid || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={cn(
          "border-border bg-bg text-text hover:bg-bg flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-4 text-left font-normal",
          "focus:border-foreground focus:ring-foreground/20 focus:ring-2",
          "data-invalid:border-danger data-invalid:focus:ring-danger/20",
          SIZE_CLASSES[size],
        )}
      >
        {/* `min-w-0` je nujen: brez njega se flex element ne skrči pod širino
            vsebine in `truncate` v otroku ne naredi nič — dolg datum je lezel
            čez rob v sosednje polje. */}
        <span className="flex min-w-0 items-center gap-2.5">
          <Calendar
            aria-hidden
            strokeWidth={1.5}
            className="text-muted size-4 shrink-0"
          />
          <span className={cn("truncate", !parsedValue && "text-muted/60")}>
            {parsedValue ? dateFmt.format(parsedValue) : placeholder}
          </span>
        </span>
      </Button>

      {open && pos && cilj
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={l.dialog}
              style={{
                top: pos.dropUp ? undefined : pos.top,
                bottom: pos.dropUp ? window.innerHeight - pos.top : undefined,
                left: pos.left,
              }}
              // Na telefonu koledar teče čez VSO širino zaslona in ne v
              // 288 px široki škatli: dnevi so tam 32 px — premalo za prst,
              // pol zaslona pa stoji prazno. Od `sm` ostane, kot je bilo.
              className="bg-surface border-foreground/8 fixed z-(--z-dropdown) w-72 rounded-lg border p-3 shadow-lg shadow-black/5 max-sm:inset-x-2 max-sm:w-auto max-sm:p-(--s3)"
            >
              {/* Header — month/year + nav */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  label={l.prevMonth}
                  onClick={() =>
                    setViewMonth(({ year, month }) =>
                      month === 0
                        ? { year: year - 1, month: 11 }
                        : { year, month: month - 1 },
                    )
                  }
                  // 44 px na dotik, 28 z miško. S puščicama se pride do
                  // naslednjega meseca — brez njiju rezervacije za
                  // december ni mogoče vpisati.
                  className="hover:bg-foreground/4 text-text/70 hover:text-text size-11 rounded-md sm:size-7"
                >
                  <ChevronLeft className="size-4" strokeWidth={1.5} />
                </IconButton>
                <div className="text-text type-small font-medium">
                  {monthName(locale, viewMonth.year, viewMonth.month)}
                </div>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  label={l.nextMonth}
                  onClick={() =>
                    setViewMonth(({ year, month }) =>
                      month === 11
                        ? { year: year + 1, month: 0 }
                        : { year, month: month + 1 },
                    )
                  }
                  // 44 px na dotik, 28 z miško. S puščicama se pride do
                  // naslednjega meseca — brez njiju rezervacije za
                  // december ni mogoče vpisati.
                  className="hover:bg-foreground/4 text-text/70 hover:text-text size-11 rounded-md sm:size-7"
                >
                  <ChevronRight className="size-4" strokeWidth={1.5} />
                </IconButton>
              </div>

              {/* Weekday headers */}
              <div className="text-muted/60 type-label grid grid-cols-7 gap-1 pb-1 text-center">
                {weekdays.map((w, i) => (
                  <span key={`${w}-${i}`}>{w}</span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 max-sm:justify-items-stretch max-sm:gap-0.5">
                {daysGrid.map((cell, i) => {
                  if (!cell.date) {
                    return <span key={i} />;
                  }
                  const d = cell.date;
                  const selected = isSelected(d);
                  const today = isToday(d);
                  const out = isOutOfRange(d);
                  return (
                    <Button
                      key={i}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        !out && select(d.getFullYear(), d.getMonth(), d.getDate())
                      }
                      disabled={out}
                      aria-pressed={selected}
                      className={cn(
                        // 44 px na dotik, 32 z miško. Dan v koledarju je
                        // tarča, ki se zadene enkrat in mora biti prava.
                        "type-small sm:type-micro size-11 rounded-md bg-transparent px-0 font-normal tabular-nums sm:size-8",
                        !selected && !today && "text-text/80",
                        !selected && today && "text-text ring-foreground/20 ring-1",
                        selected &&
                          "bg-foreground text-background hover:bg-foreground/90 hover:text-background font-medium",
                        !selected && !out && "hover:bg-foreground/6 hover:text-text",
                        out && "cursor-not-allowed opacity-30",
                      )}
                    >
                      {d.getDate()}
                    </Button>
                  );
                })}
              </div>

              {/* Footer — Danes / Počisti */}
              <div className="border-chrome-line mt-2 flex items-center justify-between border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  // 44 px na dotik: prej 16 px visoka vrstica besedila, kar je
                  // bila najmanjša tarča v celem oknu.
                  className="text-text/80 hover:text-text type-small sm:type-micro h-11 rounded-none bg-transparent px-1 font-normal hover:bg-transparent sm:h-auto sm:p-0"
                >
                  {l.today}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  disabled={!value}
                  className="text-muted hover:text-text type-small sm:type-micro h-11 gap-1 rounded-none bg-transparent px-1 font-normal hover:bg-transparent disabled:opacity-40 sm:h-auto sm:p-0"
                >
                  <CalendarOff className="size-3" strokeWidth={1.8} />
                  {l.clear}
                </Button>
              </div>
            </div>,
            cilj,
          )
        : null}
    </div>
  );
}

function parseISO(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(date.getTime())) return null;
  return date;
}
