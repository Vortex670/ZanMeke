import "server-only";

// ============================================================================
// lib/admin/brand.ts — katera različica teče
// ----------------------------------------------------------------------------
// Ko kaj ne dela, je prvo vprašanje vedno »katera različica je zunaj«. Zato
// je odgovor v nogi administracije, ne v dnevniku, do katerega je treba priti.
//
// Vercel ob gradnji nastavi commit; lokalno tega ni in piše »razvoj« — kar je
// prav tako odgovor.
// ============================================================================

export function razlicicaStrani(): string {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const verzija = process.env.npm_package_version ?? "1.0.0";
  return commit ? `v${verzija} · ${commit.slice(0, 7)}` : `v${verzija} · razvoj`;
}
