"use client";

import { X } from "lucide-react";
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Dialog — modalno okno na native HTML `<dialog>` elementu.
 *
 * **Zakaj native <dialog>, ne Radix**:
 *   - Native v 2026 ima focus trap, ESC handling, scroll lock, restore focus.
 *   - `::backdrop` pseudo za overlay, brez dodatnega wrapper div-a.
 *   - Z 0 zunanjih deps (Radix ~10KB, tu 0).
 *   - Safari 15.4+, Firefox 98+, Chrome 37+ — vse, kar podpira Next.js 16.
 *
 * **Zakaj ne čisti native**:
 *   - Animacije zahtevajo malo JS-a (dialog.showModal()/close() pogoji).
 *   - Controlled pattern (`open` prop + `onOpenChange`) je za React ergonomijo.
 *
 * **A11y privzeto:**
 *   - `aria-modal="true"` + `role="dialog"` (browser doda ob showModal).
 *   - `aria-labelledby` → `<DialogTitle>` id (auto preko context-a).
 *   - Focus trap, ESC to close, click na backdrop to close (vse browser).
 *
 * Uporaba:
 *   ```tsx
 *   const [open, setOpen] = useState(false);
 *
 *   <Button onClick={() => setOpen(true)}>Odpri</Button>
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent>
 *       <DialogTitle>Potrdi rezervacijo</DialogTitle>
 *       <DialogDescription>
 *         Po potrditvi bomo poslali e-mail.
 *       </DialogDescription>
 *       <div className="mt-4 flex gap-2 justify-end">
 *         <DialogClose asChild>
 *           <Button variant="ghost">Prekliči</Button>
 *         </DialogClose>
 *         <Button onClick={handleConfirm}>Potrdi</Button>
 *       </div>
 *     </DialogContent>
 *   </Dialog>
 *   ```
 */

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

type DialogContextValue = {
  titleId: string;
  descId: string;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(
      "DialogContent/Title/Description/Close mora biti uporabljen znotraj <Dialog>",
    );
  }
  return ctx;
}

// ------------------------------------------------------------------
// Dialog (root) — nadzira open/close in pošlje context
// ------------------------------------------------------------------

type DialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Krajša oblika, kadar te zanima samo zaprtje. */
  onClose?: () => void;
  children: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  onClose,
  children,
  className,
}: DialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else if (!next) onClose?.();
  };
  const titleId = useId();
  const descId = useId();
  void className;

  return (
    <DialogContext.Provider value={{ titleId, descId, onOpenChange: handleOpenChange }}>
      <DialogInner open={open} onOpenChange={handleOpenChange}>
        {children}
      </DialogInner>
    </DialogContext.Provider>
  );
}

/**
 * Notranji wrapper, ki drži ref na <dialog> in sinhronizira open state.
 * Ločeno od Dialog-a, da context-provider ne re-renderja ob odpiranju.
 */
function DialogInner({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sinhroniziraj React open → DOM <dialog>.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) {
      // showModal dodeli top layer, focus trap, backdrop.
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Dokler je okno odprto, stran za njim MIRUJE.
  //
  // `showModal()` naredi ozadje neaktivno, drsenja pa ne ustavi: kolesce nad
  // zatemnjenim delom premika stran pod oknom, na dotik pa se stran premakne
  // tudi, kadar prst začne na oknu in to ne more več naprej. Gost je videl,
  // kako se jedilnik pomika za oknom, v katerem izbira.
  //
  // Odmik namesto `overflow: hidden` brez nadomestila: ko drsnik izgine, se
  // stran razširi za njegovo širino in vse pod oknom poskoči vstran. Na
  // telefonu drsnika ni in odmik je 0.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement: html } = document;
    // Ustavi se OBOJE. Drsnik strani je na <html>, ne na <body>; `overflow`
    // z <body> se na <html> prenese samo, dokler ima <html> vrednost
    // `visible`. Dovolj je eno pravilo v slogovni datoteki in prenosa ni
    // več — stran bi spet tekla pod oknom, brez vidnega vzroka.
    const prej = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOdmik: body.style.paddingRight,
    };
    const drsnik = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    // Ko drsnik izgine, se stran razširi za njegovo širino in vse pod oknom
    // poskoči vstran. Na telefonu drsnika ni in odmik je 0.
    if (drsnik > 0) body.style.paddingRight = `${drsnik}px`;
    return () => {
      html.style.overflow = prej.htmlOverflow;
      body.style.overflow = prej.bodyOverflow;
      body.style.paddingRight = prej.bodyOdmik;
    };
  }, [open]);

  // Ko user ESC-a ali klikne backdrop, <dialog> sam sproži "close" event.
  // Sinhroniziraj nazaj v React state.
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Klik na ozadje: `<dialog>` je sam svoje ozadje, zato je klik nanj klik
  // mimo vsebine. Ne zadošča pa gledati samo cilja klika: kadar se pritisk in
  // spust zgodita na različnih elementih (vlečenje — drsnik za prijavo,
  // označevanje besedila, ki uide iz polja), brskalnik `click` dostavi
  // njunemu skupnemu predniku, to pa je prav `<dialog>`. Okno se je zato
  // zaprlo sredi geste in obrazca sploh ni bilo mogoče oddati.
  //
  // Zato si zapomnimo, kje se je gesta ZAČELA: zapremo le, kadar sta pritisk
  // in klik oba na ozadju.
  const pressedOnBackdrop = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDialogElement>) => {
    pressedOnBackdrop.current = e.target === e.currentTarget;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget && pressedOnBackdrop.current) {
      ref.current?.close();
    }
    pressedOnBackdrop.current = false;
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      // Resetiramo nativne stile, ker <dialog> ima default padding/border/bg.
      // Namerno uporabimo Tailwind + tokene za vse.
      className={cn(
        "bg-transparent p-0 outline-none",
        // Backdrop se renderja z ::backdrop pseudo; v Tailwindu: backdrop:*
        "backdrop:bg-scrim backdrop:backdrop-blur-sm",
        // Eksplicitno centriranje — UA stylesheet tega ne naredi zanesljivo
        // v vseh browser-jih (Chrome ga občasno prilepi levo zaradi margin:0
        // na <html>/<body> overrrides od Tailwind preflighta). Z `fixed
        // inset-0 m-auto` je dialog zanesljivo sredi viewporta, tako po širini
        // kot po višini — ne glede na scroll position ali layout nadrejene strani.
        "fixed inset-0 m-auto",
        // Na telefonu okno ZAVZAME CEL ZASLON — od roba do roba, brez
        // zaobljenih vogalov in brez okvirja. Ni več okence, ki plava nad
        // stranjo, ampak zaslon zase, tako kot v aplikaciji. Vsak piksel
        // odmika je tam šel od besedila: pri 375 px je bilo vsebine 286 px,
        // zdaj 343.
        // Na širšem zaslonu ostane okno, ki plava sredi strani in ima zrak
        // okoli sebe — tam prostora je in cel zaslon bi bil pretiravanje.
        "max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none",
        "sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)]",
        // Brez sistemskega drsnika. Okno ima zaobljene vogale in svetlo
        // ploskev; sivi pas ob desnem robu je šel čez oboje in je bil videti
        // kot da je okno prilepljeno na stran, ne v njej. Drsi se z
        // miškinim kolescem, prstom in tipkovnico kot prej.
        "scrollbar-none overscroll-contain",
      )}
    >
      {/* Vsebina se izriše ŠELE, ko je okno odprto.
          Prej je bila v drevesu vedno. Na `/ponudba` je to pomenilo, da vsak
          gumb »+« pri jedi s seboj nosi celo izrisano okno — ploščice za
          velikost, do enaindvajset gumbov za doplačila, polje za željo in
          nogo z gumbi. Izmerjeno: 68 oken v HTML-ju in 1,71 MB strani, ki jo
          gost odpre z Googlovih Zemljevidov, pogosto pred gostilno na
          mobilnem omrežju.

          Sam `<dialog>` OSTANE v drevesu, ker `ref` in `close()` potrebujeta
          element; izpusti se samo njegova vsebina. Stanja se s tem ne izgubi,
          ker ga vsa ta okna hranijo v starševski komponenti in ne v vsebini.

          Velja za vsako okno na strani in v administraciji, kjer je okno pri
          vsaki vrstici seznama — zato je popravek tu in ne pri posamezni
          jedi. */}
      {open ? children : null}
    </dialog>
  );
}

// ------------------------------------------------------------------
// DialogContent — wrapper, ki drži vsebino modalnega okna
// ------------------------------------------------------------------

type DialogContentProps = HTMLAttributes<HTMLDivElement> & {
  /** Širina — `sm` (400px), `md` (520px, default), `lg` (720px), `full`. */
  size?: "sm" | "md" | "lg" | "full";
  /**
   * Privzeto se v desnem zgornjem kotu izriše X gumb za zapiranje (a11y
   * labeliran kot "Zapri"). Nastavi na `true`, če modal obvezno zahteva
   * odločitev in ne sme imeti "dismiss" afordance (npr. irreverzibilni
   * workflow). Večinoma pusti privzeto.
   */
  hideCloseButton?: boolean;
  /** Label za X close gumb (SR) — privzeto slovensko "Zapri". */
  closeLabel?: string;
};

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    {
      className,
      size = "md",
      hideCloseButton = false,
      closeLabel = "Zapri",
      children,
      ...props
    },
    ref,
  ) {
    const { titleId, descId, onOpenChange } = useDialogContext();

    const sizeClasses = {
      sm: "w-[400px]",
      md: "w-[520px]",
      lg: "w-[720px]",
      full: "w-[calc(100vw-2rem)]",
    }[size];

    return (
      <div
        ref={ref}
        role="document"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "bg-bg text-text relative max-w-full rounded-lg",
          "border-border border shadow-lg",
          // Cel zaslon na telefonu: kvadratno, brez okvirja in sence — oboje
          // je videti kot rob predmeta, tu pa roba ni, ker je predmet zaslon.
          "max-sm:min-h-dvh max-sm:w-full max-sm:rounded-none max-sm:border-0 max-sm:shadow-none",
          // Ekstra right padding rezervira prostor za absolute X close
          // gumb v zgornjem desnem kotu — sicer bi daljši title teptal
          // gumb. Če je gumb skrit (`hideCloseButton`), pade na privzeti
          // simetrični padding.
          // Na telefonu 16 px odmika namesto 24. Od `sm` ostane, kot je
          // bilo.
          // Na telefonu je odmik SIMETRIČEN — 16 px na obeh straneh.
          // Večji desni odmik obstaja zaradi križca v zgornjem desnem kotu,
          // a križec se lahko zaleti samo z NASLOVOM, ne z vsem v oknu.
          // Prej ga je plačevala vsaka vrstica: ploskve, ki naj bi tekle od
          // roba do roba, so se na desni ustavile 40 px prej. Prostor si
          // zdaj vzame `DialogTitle` sam.
          hideCloseButton ? "p-4 sm:p-6 md:p-8" : "p-4 sm:p-6 sm:pr-12 md:p-8 md:pr-14",
          sizeClasses,
          className,
        )}
        {...props}
      >
        {hideCloseButton ? null : (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            className={cn(
              // Absolute v desnem zgornjem kotu padding boxa (inset 0.75–1rem).
              // Z-index ni potreben — dialog je v top-layer, relative sibling-i
              // se ne tepejo.
              // 44 px na dotik, 32 z miško. Na telefonu je to pri več oknih
              // EDINI izhod — gumb »Prekliči« je tam namenoma skrit —, pa še
              // ob samem robu zaslona, kjer je palec najmanj natančen.
              "absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center sm:h-8 sm:w-8",
              "rounded-full border border-transparent",
              "text-muted hover:text-text hover:bg-surface-2/70",
              "hover:border-border/60 transition-colors",
              "focus-visible:ring-accent focus-visible:ring-2 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-bg focus-visible:outline-none",
            )}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        {children}
      </div>
    );
  },
);

// ------------------------------------------------------------------
// DialogTitle / DialogDescription / DialogClose
// ------------------------------------------------------------------

export function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2
      id={titleId}
      className={cn(
        "text-text type-h3 font-semibold",
        // Prostor za križec v kotu. Na telefonu ga nosi naslov, ker je
        // tam odmik okna simetričen; od `sm` ga nosi `DialogContent`.
        "max-sm:pr-10",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useDialogContext();
  return (
    <p id={descId} className={cn("text-muted type-small mt-2", className)} {...props} />
  );
}

/**
 * DialogClose — otrok button/element, ki zapre dialog.
 * Z `asChild` nameri klon otroka z onClick handler-jem; brez `asChild`
 * renderiraj navaden `<button>`.
 */
export function DialogClose({
  children,
  asChild = false,
  className,
  ...props
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLButtonElement>, "children">) {
  const { onOpenChange } = useDialogContext();

  const handleClick = () => onOpenChange(false);

  if (asChild) {
    // Clone otroka in dodaj onClick; React.cloneElement namesto Slot-a, da
    // se izognemo Radix deps.
    if (!isValidElement(children)) {
      throw new Error("DialogClose asChild potrebuje en React element otroka.");
    }
    const child = children as ReactElement<{
      onClick?: (e: ReactMouseEvent) => void;
    }>;
    return cloneElement(child, {
      onClick: (e: ReactMouseEvent) => {
        child.props.onClick?.(e);
        handleClick();
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}
