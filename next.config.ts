import type { NextConfig } from "next";

// ============================================================================
// next.config.ts
// ----------------------------------------------------------------------------
// Varnostne glave so tu in ne v posrednem strežniku: stran gostuje na Vercelu,
// kjer drugega mesta zanje ni. CSP namenoma ni zapisana tu — stran nima
// zunanjih skript razen pisav Google, ki jih pokrije `style-src`.
// ============================================================================

const glave = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: glave }];
  },
};

export default nextConfig;
