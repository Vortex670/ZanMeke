import Link from "next/link";

import { cn } from "@/lib/utils/cn";

// ============================================================================
// <Gumb /> — edini gumb na strani
// ----------------------------------------------------------------------------
// Tri različice, nič več: `polni` za glavno dejanje, `obris` za drugo
// možnost in `tih` za tretjo. Vsaka stran ima natanko en polni gumb v vidnem
// polju — če sta dva, nobeden ni glavni.
//
// Gumb je lahko tudi povezava (`href`). Odločitev ni slogovna: kar vodi
// drugam, mora biti <a>, da se da odpreti v novem zavihku in da ga bralnik
// zaslona prebere kot povezavo.
// ============================================================================

type Videz = "polni" | "obris" | "tih";

const VIDEZ: Record<Videz, string> = {
  polni: "bg-poudarek text-na-obratu hover:opacity-90",
  obris: "border-crta border hover:border-crnilo text-crnilo",
  tih: "text-poudarek hover:opacity-80",
};

const OSNOVA =
  "type-label inline-flex items-center justify-center gap-2 rounded-full px-s3 py-3 transition-[opacity,border-color] disabled:cursor-not-allowed disabled:opacity-55";

type Skupno = { videz?: Videz; className?: string; children: React.ReactNode };

export function Gumb({
  videz = "polni",
  className,
  children,
  ...rest
}: Skupno & React.ComponentProps<"button">) {
  return (
    <button {...rest} className={cn(OSNOVA, VIDEZ[videz], className)}>
      {children}
    </button>
  );
}

export function GumbPovezava({
  videz = "polni",
  className,
  children,
  href,
  zunanja,
  ...rest
}: Skupno & { href: string; zunanja?: boolean } & React.ComponentProps<"a">) {
  const razred = cn(OSNOVA, VIDEZ[videz], className);

  if (zunanja || href.startsWith("http") || href.startsWith("tel:")) {
    return (
      <a
        {...rest}
        href={href}
        className={razred}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={razred}>
      {children}
    </Link>
  );
}
