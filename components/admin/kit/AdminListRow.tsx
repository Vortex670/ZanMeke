import type { HTMLAttributes, ReactNode } from "react";

import { StatusRail, type AdminListRowTone } from "@/components/admin/kit/StatusRail";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminListRow> — ENA kartica vrstice v admin seznamih.
// ----------------------------------------------------------------------------
//   ┃ ← statusni trak (3 px, barva pove stanje)
//   ┃  vsebina vrstice
//
// Zakaj ena komponenta: vsak seznam je imel svojo kartico — gostje in
// rezervacije s trakom ob levem robu, mnenja in plačila brez, z različnimi
// zaobljenji, sencami in odmiki. Videz vrstice je odslej TU; seznam poda
// samo vsebino in ton traku.
//
// Kartica je `bg-bg/60` (ugreznjena), ker stoji znotraj `AdminSection`
// (`bg-surface`, dvignjena) — brez tega se z njo zlije.
//
// Ista datoteka na obeh projektih (zanmeke.com `components/admin/AdminListRow.tsx`).
// ============================================================================

export function AdminListRow({
  tone = "neutral",
  children,
  className,
  as: Tag = "article",
  ...props
}: HTMLAttributes<HTMLElement> & {
  tone?: AdminListRowTone;
  children: ReactNode;
  /** `article` (privzeto) ali `div`, kadar je vrstica že v `<li>`. */
  as?: "article" | "div";
}) {
  return (
    <Tag
      className={cn(
        "bg-bg/60 relative overflow-hidden shadow-(--shadow-card)",
        // TELEFON: vrstica gre od roba do roba — kvadratna, brez sence in
        // brez traku ob levem robu. Zaobljena kartica v zaobljeni kartici v
        // zaobljenem odseku je jed odrinila 37 px od roba zaslona; na 375 px
        // je to desetina širine, porabljena za tri robove drug ob drugem.
        //
        // Trak stanja odpade skupaj z njimi: nosil je isto, kar pove značka
        // »Skrito«, zahteval pa je svoj levi odmik in je bil edino, kar je
        // vrstico še držalo stran od roba.
        "max-sm:rounded-none max-sm:shadow-none",
        "sm:rounded-xl",
        // Levi odmik od `sm` pusti prostor traku, da se besedilo ne dotika
        // roba; na telefonu traku ni, zato je odmik povsod enak in večji.
        "p-(--s3) sm:p-(--s3) sm:pl-(--s4)",
        "transition-all duration-(--dur-fast)",
        "hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover)",
        className,
      )}
      {...props}
    >
      <span className="max-sm:hidden">
        <StatusRail tone={tone} />
      </span>
      {children}
    </Tag>
  );
}

// Ton je definiran ob traku (`StatusRail`); tu ga samo ponovimo, da
// obstoječi uvozi iz te datoteke ostanejo veljavni.
export type { AdminListRowTone };
