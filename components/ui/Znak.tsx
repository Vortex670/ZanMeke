import type { SVGProps } from "react";

// ============================================================================
// <Znak /> — znamenje Žana Mekeja
// ----------------------------------------------------------------------------
// Ista oblika kot ikona strani (`public/ikona-*.png`): odprt obroč s piko v
// vrzeli. Pika je ista kot za »Žan Meke.« v nogi — od tam izhaja.
//
// Tu je VEKTOR in ne tista datoteka: PNG bi se na zaslonu z dvojno gostoto
// mehčal, barve pa ne bi mogel podedovati. Takole je znak črn na papirju,
// bel na temnem in meta na poudarku, ne da bi obstajal v treh različicah.
//
// Obroč je narisan z `stroke-dasharray`: 300° poteze in 60° vrzeli, pika
// stoji na sredini vrzeli in se obroča ne dotika — dotik bi pri 24 px zlil
// oboje v packo.
// ============================================================================

const R = 9;
const OBSEG = 2 * Math.PI * R;
const POTEZA = (300 / 360) * OBSEG;

export function Znak(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...props}>
      <circle
        cx="12"
        cy="12"
        r={R}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray={`${POTEZA} ${OBSEG - POTEZA}`}
        transform="rotate(60 12 12)"
      />
      <circle
        cx={12 + Math.cos(Math.PI / 6) * R}
        cy={12 + Math.sin(Math.PI / 6) * R}
        r="2.4"
        fill="currentColor"
      />
    </svg>
  );
}
