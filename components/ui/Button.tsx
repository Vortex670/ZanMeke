import { ArrowRight } from "lucide-react";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

/**
 * Button — primarna akcijska komponenta.
 *
 * Variante:
 *   - primary   — opečnata, beli tekst, "Krušna peč" CTA (Rezerviraj …)
 *   - secondary — bel/kremni fon, obroba, temni tekst
 *   - outline   — transparentno z obrobo (na obarvanem hero ozadju)
 *   - ghost     — brez fona, pojavi se samo na hover (icon-only nav)
 *   - link      — videti kot link, brez padding-a
 *   - danger    — destruktivno (brisanje rezervacije)
 *
 * Velikosti: sm (36 px), md (44 px ← default), lg (52 px), icon (44×44 kvadrat).
 *
 * Vse z `active:scale-[0.98]` mikrointerakcijo + focus-visible ring v accent.
 */

type Variant =
  | "cta"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "link"
  | "danger";

type Size = "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Pokaže spinner in onemogoči klik. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

// Oblika je PILULA, ne zaobljen pravokotnik.
//
// Gumb za rezervacijo v glavi strani je bil od nekdaj pilula in je edini
// gumb, ki ga gost vidi na vsaki strani — zato je on merilo. Ko so bili
// drugi gumbi zaobljeni pravokotniki, sta bila na isti strani dva jezika
// gumbov in nobeden ni bil pravilen.
const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full " +
  "select-none whitespace-nowrap " +
  "transition-[background-color,box-shadow,transform,color,border-color] duration-150 " +
  "active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Znak pred napisom pri `cta`: puščica v polnem krogu.
 *
 * Tako je bil od nekdaj videti gumb za rezervacijo v glavi strani in to je
 * edini gumb, ki ga gost vidi na vsaki strani — zato je on merilo za vse
 * glavne pozive k dejanju.
 */
export const CTA_ZNAK = (
  <span
    aria-hidden
    className="bg-accent text-accent-fg inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/cta:scale-110"
  >
    <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-x-0.5" />
  </span>
);

const variants: Record<Variant, string> = {
  // Glavni poziv k dejanju — isti kot gumb za rezervacijo v glavi strani.
  // Svetla ploskev z obrobo, puščica v polnem krogu, napis v verzalkah.
  cta:
    "group/cta bg-bg text-text border border-border hover:border-accent/40 hover:bg-surface/40 " +
    "gap-2.5 text-[12px] font-semibold tracking-[0.14em] uppercase " +
    // Našteto in ne `transition-all`: ta bi z 500 ms zajel tudi obris ob
    // fokusu, ki se mora prižgati takoj — kdor tipka s tipkovnico, pol
    // sekunde čaka, kje sploh je.
    "transition-[transform,background-color,border-color,box-shadow] duration-500 " +
    "ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5",
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm hover:shadow-md",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-2 hover:border-border-strong",
  outline: "bg-transparent text-text border border-border-strong hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface",
  link: "bg-transparent text-accent hover:underline underline-offset-4 px-0 active:scale-100",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
};

/**
 * Kar mora priti ZA velikostjo.
 *
 * `sizes` nastavi `px-6` in `text-base`, kar bi varianti `cta` prepisalo
 * njen odmik (znak v krogu se skoraj dotika levega roba) in njeno velikost
 * pisave (drobne verzalke). Vrstni red v `cn()` odloča, zato to ni okras,
 * ampak pogoj — brez njega gumb ni isti gumb.
 */
const CTA_PO_VELIKOSTI = "pl-1.5 pr-5 text-[12px]";

const sizes: Record<Size, string> = {
  // Na dotik 44 px, z miško 36.
  //
  // Priporočilo za dotik je najmanj 44 × 44 px. Administracijo osebje
  // uporablja skoraj izključno s telefona, `sm` in `icon-sm` pa nosita vsa
  // dejanja v vrsticah seznamov in glavah strani — torej ni bilo v adminu
  // nobenega gumba, ki bi mero dosegel. Uničujoča dejanja (izbris, skrij
  // odsek) so stala 4 px od gumbov za premik.
  sm: "h-11 px-3 text-sm sm:h-9",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  // Tri ikonske velikosti, iste kot na second-home.hr: drobna za dejanja v
  // vrstici seznama, srednja za obrazce, velika za glavo panela.
  "icon-sm": "h-11 w-11 p-0 [&_svg]:size-4 sm:h-9 sm:w-9",
  icon: "h-11 w-11 p-0",
  "icon-lg": "h-12 w-12 p-0 [&_svg]:size-5",
};

function renderContent({
  loading,
  leftIcon,
  rightIcon,
  children,
}: {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {rightIcon}
    </>
  );
}

/**
 * Videz glavnega poziva k dejanju za mesta, ki NE morejo uporabiti `Button`.
 *
 * Okno za rezervacijo si svoj sprožilec izriše samo in sprejme le napis,
 * začetni znak in razrede. Brez tega bi vsak tak sprožilec razrede prepisal
 * na roko — in prav tako so nastali trije različni »glavni« gumbi na treh
 * straneh.
 */
export const CTA_SPROZILEC = {
  startContent: CTA_ZNAK,
  className: cn(base, variants.cta, sizes.lg, CTA_PO_VELIKOSTI),
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      ...rest
    } = props;

    const classes = cn(
      base,
      variants[variant],
      sizes[size],
      variant === "cta" && CTA_PO_VELIKOSTI,
      className,
    );
    // Puščica v krogu je del te variante, ne stvar klicatelja: gumb, ki bi
    // jo pozabil, ne bi bil isti gumb.
    const content = renderContent({
      loading,
      leftIcon: variant === "cta" && !leftIcon ? CTA_ZNAK : leftIcon,
      rightIcon,
      children,
    });

    if (rest.as === "a") {
      const { href, as: _as, ...anchorRest } = rest as ButtonAsAnchor;
      void _as;
      // Zunanji naslov in SIDRO gresta skozi navadno sidrno oznako.
      // Sidro zato, ker `Link` iz next-intl vsakemu naslovu predpne jezik in
      // iz »#rezervacija« naredi »/sl#rezervacija« — kar je druga stran in
      // ne okno na tej. Okno za rezervacijo se odpre prav na to sidro.
      const isExternal = /^https?:\/\//.test(href) || href.startsWith("#");

      // `/api/...` NI STRAN TE APLIKACIJE, ampak datoteka ali odgovor
      // strežnika. Skozi `Link` ga prevzame odjemalski usmerjevalnik, ki za
      // tak naslov nima strani — gumb »Izvozi mesec (CSV)« je zato navidez
      // nič ne naredil, datoteke pa ni bilo nikjer. Navadno sidro prepusti
      // odgovor brskalniku in ta ga shrani.
      const jeDatoteka = href.startsWith("/api/");

      if (isExternal || jeDatoteka) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={classes}
            {...(href.startsWith("#") || jeDatoteka
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            aria-disabled={loading || undefined}
            {...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-disabled={loading || undefined}
          {...(anchorRest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
        >
          {content}
        </Link>
      );
    }

    const buttonRest = rest as ButtonAsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonRest.type ?? "button"}
        className={classes}
        disabled={loading || buttonRest.disabled}
        aria-busy={loading || undefined}
        {...buttonRest}
      >
        {content}
      </button>
    );
  },
);
