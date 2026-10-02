"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  Fragment,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useFieldContext } from "@/components/ui/field-context";
import { HiddenField } from "@/components/ui/HiddenField";
import { cn } from "@/lib/utils";

/**
 * SelectMenu — controlled custom dropdown za izbor ene vrednosti v formah.
 *
 * **Zakaj ne native `<Select>`**:
 *   - Native select picker odpre OS UI (iOS wheel / Chrome dropdown), ki ne
 *     uporablja naše design-tokens palete in ne podpira chevron up/down
 *     animacije ali ikoni za opcije.
 *   - Tu hočemo popolno vizualno kontrolo (listbox panel z našimi barvami,
 *     hover tokens, rounded rogovi, chevron rotacija).
 *
 * **Cena**:
 *   - +lastna a11y implementacija: `role="combobox"` trigger z
 *     `aria-expanded`, `aria-controls`, `aria-activedescendant` + `role="listbox"`
 *     panel z `role="option"` elementi. Keyboard: Arrow up/down premika
 *     highlight, Enter izbere, Esc zapre, Home/End skoči na rob, A-Z
 *     type-ahead.
 *   - Hidden `<input name type="hidden">` skrbi, da form submit vključi izbrano
 *     vrednost (server action jo prebere preko FormData).
 *
 * Uporaba:
 *   ```tsx
 *   <Field>
 *     <Label>Kanal</Label>
 *     <SelectMenu
 *       name="channel"
 *       value={channel}
 *       onValueChange={setChannel}
 *       options={[
 *         { value: "BOOKING_DOT_COM", label: "Booking.com" },
 *         { value: "AIRBNB", label: "Airbnb" },
 *       ]}
 *       placeholder="Izberi kanal"
 *     />
 *   </Field>
 *   ```
 *
 * Če potrebujete search/filter, je to druga komponenta — `Combobox` (tbd).
 */

export type SelectMenuOption<T extends string = string> = {
  value: T;
  label: string;
  /** Druga vrstica pod oznako — pojasnilo izbire. */
  description?: string;
  /** Leva ikona (Lucide ali poljubno vozlišče). */
  icon?: ReactNode;
  /** Onemogočena možnost — vidna, a ne klikljiva. */
  disabled?: boolean;
  /** Naslov skupine; zaporedne možnosti z istim naslovom se združijo. */
  group?: string;
};

/** Staro ime, da obstoječi uvozi ostanejo veljavni. */
export type SelectOption = SelectMenuOption;

type SelectMenuProps<T extends string = string> = {
  name?: string;
  /** Višina pilule: `sm` = 40 px (vrstica filtrov), `md` = 48 px (obrazci). */
  selectSize?: "sm" | "md";
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SelectMenuOption<T>>;
  /** Sklic na sprožilec. */
  ref?: Ref<HTMLButtonElement>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Izrecno označi napako; sicer se prevzame iz konteksta `Field`. */
  invalid?: boolean;
  /** Poravnava spustnega seznama glede na sprožilec. */
  align?: "start" | "end";
  className?: string;
  id?: string;
  /** Aria-label če ni Label nad trigger-jem. */
  "aria-label"?: string;
  /** Vodilna ikona v pill-u (kot Input.leftIcon). KANON: če je polje
   *  semantično ekvivalent text inputu, vedno dodaj leftIcon. */
  leftIcon?: ReactNode;
};

export function SelectMenu<T extends string = string>({
  name,
  selectSize = "md",
  value,
  onValueChange,
  options,
  placeholder,
  required,
  disabled,
  invalid,
  align = "start",
  className,
  id: idProp,
  leftIcon,
  ref,
  ...rest
}: SelectMenuProps<T>) {
  const ctx = useFieldContext();
  const autoId = useId();
  const id = idProp ?? ctx?.id ?? autoId;
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  });

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Kadar je izbirnik v native `<dialog>`, mora seznam v ISTI <dialog>:
  // dialog stoji v zgornji plasti nad vsem drugim, zato bi se seznam,
  // poslan v `document.body`, izrisal POD njim.
  const [portalCilj, setPortalCilj] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalCilj(triggerRef.current?.closest("dialog") ?? null);
  }, []);
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Poudarek sledi vrednosti brez učinka: če se je vrednost spremenila od
  // zunaj, ga preračunamo med izrisom (vzorec »prilagoditev stanja ob
  // spremembi lastnosti«, React docs). `setState` v telesu učinka bi sprožil
  // kaskadne izrise in ga pravilo `react-hooks/set-state-in-effect` zavrne.
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setHighlight(idx);
  }

  // Pozicija seznama — seznam gre v portal na <body>, da ga ne more
  // prekriti nobena kartica z lastnim slojem (FadeIn/Stagger ustvarita
  // svoj stacking context). Merimo sprožilec in seznam postavimo fiksno.
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    right: number;
    width: number;
    dropUp: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const belowSpace = window.innerHeight - r.bottom;
      const dropUp = belowSpace < 260 && r.top > belowSpace;
      setPos({
        top: dropUp ? r.top - 6 : r.bottom + 6,
        left: r.left,
        right: window.innerWidth - r.right,
        width: r.width,
        dropUp,
      });
    };
    // Prva meritev ni v telesu učinka, ampak v naslednjem okvirju — telo
    // učinka ne sme klicati `setState` (kaskadni izrisi).
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      // Počisti ob ZAPRTJU (v pospravljanju, ne v telesu učinka), da ob
      // naslednjem odprtju seznam ne utripne na starem mestu.
      setPos(null);
    };
  }, [open]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Če je SelectMenu ugnezden v native `<dialog>` (naš Dialog komponent),
  // browser ob Escape sproži `cancel` event na <dialog> in ga zapre. To ni
  // to, kar admin želi — pričakuje, da Escape najprej zapre samo dropdown.
  // Zato tukaj, dokler je dropdown odprt, prestrežemo cancel event na
  // najbližjem <dialog>-u in ga preventDefault-amo; dropdown pa sami
  // zapremo (state update ujame tudi nativni keydown handler zgoraj).
  useEffect(() => {
    if (!open) return;
    const dialogEl = triggerRef.current?.closest("dialog");
    if (!dialogEl) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    dialogEl.addEventListener("cancel", onCancel);
    return () => dialogEl.removeEventListener("cancel", onCancel);
  }, [open]);

  // Scroll highlighted item into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const selectIndex = useCallback(
    (idx: number) => {
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      onValueChange(opt.value);
      setOpen(false);
      // Vrni fokus na trigger, da keyboard flow ostane konsistenten.
      triggerRef.current?.focus();
    },
    [options, onValueChange],
  );

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      setHighlight((prev) => {
        const n = options.length;
        let next = prev;
        for (let i = 0; i < n; i++) {
          next = (next + direction + n) % n;
          if (!options[next]?.disabled) return next;
        }
        return prev;
      });
    },
    [options],
  );

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        // Ne dovoli, da Escape zleti naprej do Dialog parent-a (ki bi sicer
        // zaprl tudi modal okno skupaj z dropdownom).
        e.stopPropagation();
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectIndex(highlight);
        break;
      default:
        // Type-ahead: skoči na prvo opcijo, ki se začne s črko.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const lower = e.key.toLowerCase();
          const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(lower));
          if (idx >= 0) setHighlight(idx);
        }
    }
  };

  // Assign trigger ref both to consumer and internal.
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    (triggerRef as { current: HTMLButtonElement | null }).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const isInvalid = invalid ?? ctx?.hasError;

  return (
    <div ref={rootRef} className="relative w-full">
      {/* Hidden input za form submit — Next.js server action prebere FormData. */}
      {name ? <HiddenField name={name} value={value} required={required} /> : null}

      <button
        ref={setTriggerRef}
        type="button"
        role="combobox"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-required={required || undefined}
        aria-invalid={isInvalid || undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          // KANON: identičen pill stil kot Input.tsx wrapper —
          // Ista oblika kot `Input`: blago zaobljen pravokotnik, da se polja
          // v enem obrazcu ne razlikujejo med sabo.
          "bg-bg/60 text-text relative flex " +
            (selectSize === "sm" ? "h-10" : "h-12") +
            " w-full min-w-0 items-center justify-between gap-2 rounded-lg border",
          leftIcon ? "pl-12" : "pl-4",
          "type-body pr-10 text-left leading-none",
          "transition-pill",
          "hover:border-border-strong hover:bg-bg",
          "focus-visible:border-accent focus-visible:bg-bg focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isInvalid ? "border-danger focus-visible:border-danger" : "border-border",
          open && "border-accent bg-bg",
          className,
        )}
        {...rest}
      >
        {leftIcon ? (
          <span
            aria-hidden
            className={cn(
              "text-subtle pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
              open && "text-accent",
            )}
          >
            {leftIcon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected?.icon ? (
            <span className="shrink-0" aria-hidden>
              {selected.icon}
            </span>
          ) : null}
          <span className={cn("truncate", !selected && "text-subtle")}>
            {selected ? selected.label : (placeholder ?? "")}
          </span>
        </span>
        <span
          className={cn(
            "text-subtle pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transition-transform duration-(--dur-quick)",
            open && "text-accent",
          )}
          aria-hidden
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && pos
        ? createPortal(
            <ul
              ref={listRef}
              role="listbox"
              id={listboxId}
              aria-activedescendant={`${listboxId}-opt-${highlight}`}
              tabIndex={-1}
              style={{
                top: pos.dropUp ? undefined : pos.top,
                bottom: pos.dropUp ? window.innerHeight - pos.top : undefined,
                ...(align === "end"
                  ? { right: pos.right, minWidth: pos.width }
                  : { left: pos.left, minWidth: pos.width }),
              }}
              className={cn(
                "border-border bg-surface fixed z-(--z-dropdown) flex max-h-72 flex-col overflow-auto rounded-md border shadow-lg",
                "p-1",
              )}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlight;
                const groupStart = opt.group && opt.group !== options[idx - 1]?.group;
                return (
                  <Fragment key={opt.value}>
                    {groupStart ? (
                      <li
                        role="presentation"
                        className="text-muted type-eyebrow px-2.5 pt-3 pb-1 first:pt-1"
                      >
                        {opt.group}
                      </li>
                    ) : null}
                    <li
                      id={`${listboxId}-opt-${idx}`}
                      role="option"
                      data-idx={idx}
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled || undefined}
                      onMouseEnter={() => {
                        if (!opt.disabled) setHighlight(idx);
                      }}
                      onClick={() => selectIndex(idx)}
                      className={cn(
                        "type-small flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2",
                        "transition-colors duration-(--dur-instant)",
                        "text-text",
                        isHighlighted && !opt.disabled && "bg-surface-2",
                        isSelected && "font-medium",
                        opt.disabled && "text-muted cursor-not-allowed opacity-60",
                      )}
                    >
                      {opt.icon ? (
                        <span className="shrink-0" aria-hidden>
                          {opt.icon}
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description ? (
                          <span className="text-muted type-micro block truncate">
                            {opt.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="text-accent h-4 w-4 shrink-0" aria-hidden />
                      ) : null}
                    </li>
                  </Fragment>
                );
              })}
            </ul>,
            // Kadar je izbirnik v native `<dialog>`, mora seznam v ISTI
            // <dialog>. Native dialog stoji v zgornji plasti (top layer) nad
            // vsem drugim; seznam, poslan v `document.body`, se izriše POD
            // njim — vidno je bilo, kot da spustni seznam ne dela.
            // Cilj se določi v učinku in ne med izrisom: branje `ref.current`
            // sredi izrisa je v Reactu 19 napaka, ker se izris lahko ponovi
            // ali zavrže. Ob prvem izrisu je `null` in seznam gre v `body` —
            // takrat je zaprt in se ne vidi.
            portalCilj ?? document.body,
          )
        : null}
    </div>
  );
}
