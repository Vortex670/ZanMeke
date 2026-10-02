import { ImageResponse } from "next/og";

import { STRAN } from "@/lib/podatki";

// ============================================================================
// Slika za deljenje
// ----------------------------------------------------------------------------
// To je prvo, kar človek vidi, ko mu pošlješ povezavo — v sporočilu, na
// Facebooku, v e-pošti. Brez nje pokaže predogled prazen pravokotnik in
// povezava je videti kot neželena pošta.
//
// Slika pove troje in nič več: kdo, za koga in številka. Beremo jo na
// telefonu, v predogledu velikosti palca.
//
// Risana je s sistemsko pisavo nalašč: vgradnja Archiva bi v vsak predogled
// dodala sto kilobajtov pisave, dobiček pa bi bil nič — pri tej velikosti
// razlike med grotesknima pisavama nihče ne vidi.
// ============================================================================

export const alt = "Žan Meke — spletne strani za gostilne in podjetja v Posavju";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0f1513",
        color: "#f5f7f6",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#5fd3b4",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 24, letterSpacing: 6, fontWeight: 700 }}>
            ŽAN MEKE
          </span>
          <span style={{ fontSize: 17, letterSpacing: 3, color: "#8b9794" }}>
            SPLETNE STRANI · FOTOGRAFIJA
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span
          style={{
            fontSize: 64,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: -2,
            maxWidth: 880,
          }}
        >
          Spletne strani, ki opravijo delo, ki ga zdaj opravlja telefon.
        </span>
        <span style={{ fontSize: 28, color: "#9aa6a3", maxWidth: 820 }}>
          Za gostilne, apartmaje in manjša podjetja v {STRAN.obmocje}u.
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontSize: 26,
          color: "#5fd3b4",
        }}
      >
        <span style={{ fontWeight: 700 }}>{STRAN.telefon}</span>
        <span style={{ color: "#596663" }}>·</span>
        <span style={{ color: "#8b9794" }}>{STRAN.domena}</span>
      </div>
    </div>,
    size,
  );
}
