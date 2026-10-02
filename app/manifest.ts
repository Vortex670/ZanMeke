import type { MetadataRoute } from "next";

import { OPIS, STRAN } from "@/lib/podatki";

// ============================================================================
// app/manifest.ts — stran kot nameščena aplikacija
// ----------------------------------------------------------------------------
// Brez manifesta brskalnik ob »Dodaj na začetni zaslon« sestavi ikono iz
// posnetka strani in naslova zavihka — rezultat je bled kvadrat z odrezanim
// napisom. Manifest tudi pove ime, barvo pasu in začetno pot, zato je prvi
// pogoj, da stran šteje za namestljivo.
//
// `theme_color` je temen, ker je vsak uvod strani temen: na telefonu se v to
// barvo pobarva vrstica s stanjem in prehod v stran mora biti neopazen.
//
// Ikone so geometrijske in brez črk — pisava se na 48 px ne prebere, na
// maskirani ikoni pa jo sistem obreže. `maskable` je svoja datoteka z večjim
// varnim robom; ista slika v obeh vlogah pomeni, da Android odreže rob.
// ============================================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${STRAN.ime} — spletne strani in fotografija`,
    short_name: STRAN.ime,
    description: OPIS,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1513",
    theme_color: "#0f1513",
    lang: "sl",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/ikona-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikona-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/ikona-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
