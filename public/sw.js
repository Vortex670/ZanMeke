// ============================================================================
// public/sw.js — nagrobnik za staro delovno nit
// ----------------------------------------------------------------------------
// Ta stran delovne niti (service worker) NE uporablja. Datoteka obstaja samo
// zato, ker jo brskalniki, ki so jo dobili od PREJŠNJE zanmeke.com, še vedno
// zahtevajo — in jo bodo, dokler je ne odjavijo. V dnevniku se to kaže kot
// neprekinjen niz `GET /sw.js 404`.
//
// Odjave ne more opraviti strežnik: delovna nit živi v brskalniku obiskovalca
// in se odjavi samo sama. Zato tu stoji nit, ki ob namestitvi POČISTI
// predpomnilnike in se ODJAVI. Po enem obisku je je konec — tudi na
// napravah, do katerih nimava dostopa.
//
// Ko bo stran nekaj časa objavljena in bodo stari brskalniki mimo, se datoteka
// lahko odstrani. Prej ne: brez nje stari predpomnilnik lahko streže staro
// stran, ki je ni več.
// ============================================================================

self.addEventListener("install", () => {
  // Brez čakanja na zaprtje zavihkov — nit, ki se namešča zato, da umre,
  // nima razloga čakati.
  self.skipWaiting();
});

self.addEventListener("activate", (dogodek) => {
  dogodek.waitUntil(
    (async () => {
      const imena = await caches.keys();
      await Promise.all(imena.map((ime) => caches.delete(ime)));
      await self.registration.unregister();

      // Odprte zavihke osvežimo, da takoj dobijo stran s strežnika in ne iz
      // pravkar izbrisanega predpomnilnika.
      const odjemalci = await self.clients.matchAll({ type: "window" });
      for (const odjemalec of odjemalci) odjemalec.navigate(odjemalec.url);
    })(),
  );
});
