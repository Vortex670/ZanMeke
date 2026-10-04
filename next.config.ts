import type { NextConfig } from "next";

// ============================================================================
// next.config.ts
// ----------------------------------------------------------------------------
// Varnostne glave so tu in ne v posrednem strežniku: stran gostuje na Vercelu,
// kjer drugega mesta zanje ni. ISTI NABOR kot na gostilnica-plus.si in
// second-home.hr — razlikuje se samo seznam zunanjih gostiteljev, ker ima
// vsaka stran svoje.
//
// `Content-Security-Policy` je omejitev in ne okras: brez nje lahko vsak
// vrinjen `<script>` pobere podatke iz obrazca ali sejo. Vsak dodan vir v
// njej je nova pot za to, zato se seznam širi samo takrat, ko se brez tega
// nekaj res ne izriše.
// ============================================================================

const jeProdukcija = process.env.NODE_ENV === "production";

/** Javna shramba slik (Cloudflare R2). Ime gostitelja je v okolju. */
const R2 = process.env.R2_PUBLIC_URL?.replace(/^https?:\/\//, "").replace(/\/+$/, "");

const csp = [
  "default-src 'self'",
  // Pisave gredo skozi `next/font`, torej so po gradnji na našem strežniku —
  // zato tu ni `fonts.googleapis.com` in ne `fonts.gstatic.com`.
  //
  // `unsafe-eval` samo v razvoju: Turbopackovo vroče osveževanje brez njega
  // ne dela. V produkciji ga ni.
  `script-src 'self' 'unsafe-inline' https://js.stripe.com${jeProdukcija ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Slike: posnetki del iz `public/`, naložene slike z R2, `data:` za vgrajene
  // (UPN koda) in `blob:` za predogled pred nalaganjem.
  `img-src 'self' data: blob:${R2 ? ` https://${R2}` : ""} https://*.r2.dev`,
  "font-src 'self' data:",
  // `connect-src`: strežniška dejanja gredo na isto domeno; Stripe potrebuje
  // svoj naslov za plačilno okno. V razvoju še `ws:` za osveževanje — shema
  // `ws:` ni zajeta s `'self'` in brez nje se stran ob spremembi kode ne
  // osveži, napake pa ni nikjer videti.
  `connect-src 'self' https://api.stripe.com${jeProdukcija ? "" : " ws: wss:"}`,
  // Stripovo plačilno okno se izriše v okvirju.
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Samo v produkciji: na `http://localhost` bi brskalnik zahtevek nadgradil
  // v `https://localhost`, kjer TLS-a ni.
  ...(jeProdukcija ? ["upgrade-insecure-requests"] : []),
].join("; ");

const glave = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // `payment=(self)`: plačilo s kartico teče prek Stripa na tej strani.
    // Enak nabor kot na drugih dveh straneh.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Brez tega `next/image` zavrne vsako sliko z R2 in medijska knjižnica
  // pokaže prazne okvirje. Vzorec se bere iz okolja, ker je v imenu
  // gostitelja ključ vedra.
  images: {
    remotePatterns: R2
      ? [{ protocol: "https" as const, hostname: R2 }]
      : [{ protocol: "https" as const, hostname: "*.r2.dev" }],
  },

  // Kratek naslov za zasebni 3D model hiše (lažje vtipkati na tablici).
  // Preusmeri na skriti naslov pod /h/, kjer proxy.ts zahteva geslo.
  async redirects() {
    return [
      { source: "/hisa", destination: "/h/jpd9g1n3omp2w88elt4toc/index.html", permanent: false },
    ];
  },

  async headers() {
    return [
      { source: "/:path*", headers: glave },
      // Administracija, prijava in plačilna stran z žetonom ne sodijo v
      // noben indeks — glava velja tudi tam, kjer robots.txt kdo prezre.
      {
        source: "/(admin|prijava|racun)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // Zasebne strani pod /h/… (3D model hiše): zaščitene z geslom v proxy.ts,
      // nikoli v indeksu. Stran nalaga three.js z jsDelivr in pisave z Google
      // Fonts, zato ima tu svojo, ožje omejeno politiko — velja samo za /h/.
      {
        source: "/h/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
