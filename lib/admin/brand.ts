// ============================================================================
// lib/admin/brand.ts — kar v adminu nosi ime strani.
// ----------------------------------------------------------------------------
// NASTAVITEV STRANI, ne komponenta. Noga, vrhnja vrstica in naslov okna
// berejo od tu; komponente so na vseh projektih iste.
//
// Verzija: ročno, po semverju, ob večjih izdajah. Vercel v gradnjo vstavi
// `VERCEL_GIT_COMMIT_SHA` in `VERCEL_ENV`; lokalno je okolje »dev«.
//
// Ko kaj ne dela, je prvo vprašanje vedno »katera različica je zunaj«. Zato
// je odgovor v nogi administracije in ne v dnevniku, do katerega je treba
// priti.
// ============================================================================

const APP_VERSION = "1.0.0";

export const ADMIN_BRAND = {
  /** Napis ob utripajoči piki — levo v nogi. */
  panelLabel: "Admin panel",
  /** Ime v izjavi o avtorstvu. */
  owner: "Žan Meke",
  /** Domena, izpisana desno v nogi. */
  domain: "zanmeke.com",
} as const;

export function getBuildInfo() {
  return {
    version: APP_VERSION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    env: process.env.VERCEL_ENV ?? "dev",
  };
}

/** Kratek zapis različice za nogo — `v1.0.0 · a1b2c3d`. */
export function razlicicaStrani(): string {
  const { version, commit } = getBuildInfo();
  return commit ? `v${version} · ${commit}` : `v${version} · razvoj`;
}
