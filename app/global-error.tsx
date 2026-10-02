"use client";

// ============================================================================
// Napaka, ki podre tudi korensko postavitev
// ----------------------------------------------------------------------------
// Ta datoteka se izriše NAMESTO `app/layout.tsx`, zato mora imeti svoj `html`
// in `body`. Iz istega razloga tu ni ne pisav ne slogov strani: tisto, kar bi
// jih naložilo, je prav tisto, kar se je pokvarilo. Slog je zato vgrajen in
// obseden na nekaj vrstic — stran brez slogov je grda, stran brez vsebine pa
// je prazna.
//
// Številka napake (`digest`) je edina stvar, ki jo človek lahko pove naprej,
// zato je izpisana in ne skrita v konzoli.
// ============================================================================

export default function GlobalnaNapaka({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sl">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f1513",
          color: "#f5f7f6",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.786rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5fd3b4",
            }}
          >
            Napaka
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "2rem", lineHeight: 1.1 }}>
            Nekaj se je pokvarilo.
          </h1>
          <p style={{ margin: "1rem 0 0", lineHeight: 1.6, color: "rgba(245,247,246,0.7)" }}>
            Poskusite znova. Če se ponovi, pokličite 041 401 521 — napako vidim v
            dnevniku in jo popravim.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.8rem",
                fontFamily: "ui-monospace, monospace",
                color: "rgba(245,247,246,0.4)",
              }}
            >
              Oznaka napake: {error.digest}
            </p>
          ) : null}

          <div style={{ marginTop: "1.6rem", display: "flex", gap: "0.618rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: "3rem",
                padding: "0 1.25rem",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#5fd3b4",
                color: "#0f1513",
                fontSize: "0.786rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Poskusi znova
            </button>
            {/* Navaden `a` in NE `Link`: `Link` gre skozi usmerjevalnik, ta
                pa je prav tisto, kar se je lahko pokvarilo. Tu hočemo polno
                ponovno naložitev strani. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: "3rem",
                padding: "0 1.25rem",
                borderRadius: "999px",
                border: "1px solid rgba(245,247,246,0.25)",
                display: "inline-flex",
                alignItems: "center",
                color: "#f5f7f6",
                textDecoration: "none",
                fontSize: "0.786rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Na domačo stran
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
