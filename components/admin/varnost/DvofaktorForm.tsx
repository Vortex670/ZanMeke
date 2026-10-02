"use client";

import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/actions/helpers";
import {
  izklopiTotpAction,
  noveRezervneKodeAction,
  potrdiVklopTotpAction,
  zacniVklopTotpAction,
} from "@/lib/varnost/actions";

// ============================================================================
// <DvofaktorForm /> — vklop, izklop in rezervne kode
// ----------------------------------------------------------------------------
// VKLOP IMA DVA KORAKA IN TAKO MORA BITI. Skrivnost nastane ob prikazu kode
// QR, veljati pa začne šele, ko človek vpiše kodo iz generatorja. Brez tega
// drugega koraka bi se dalo vklopiti zaščito, ki je generator nikoli ni
// prebral — in se zakleniti iz lastne administracije.
//
// REZERVNE KODE SE POKAŽEJO ENKRAT. V bazi so samo odtisi, zato jih ni mogoče
// pokazati znova; če se izgubijo, se izda nov komplet. To je zapisano ob
// kodah in ne v navodilih, ker navodil nihče ne bere.
//
// Koda QR se izriše na odjemalcu iz naslova `otpauth://`: slika s skrivnostjo
// ne sme nikoli nastati na strežniku in iti skozi predpomnilnik.
// ============================================================================

type Stanje = { vklopljena: boolean; preostaleKode: number };

export function DvofaktorForm({ stanje }: { stanje: Stanje }) {
  const [qr, nastaviQr] = useState<{ naslov: string; skrivnost: string } | null>(null);
  // Kode se IZPELJEJO iz izida dejanja in se ne prepisujejo v svoje stanje:
  // React 19 prepoveduje `setState` v učinku, podvojeno stanje pa je tako ali
  // tako vir neskladja — enkrat bi se pokazale stare kode poleg novih.
  const [skrite, nastaviSkrite] = useState(false);
  const [zacenjam, zacni] = useTransition();

  // ── Vklop: prvi korak ────────────────────────────────────────────────────
  function zacniVklop() {
    zacni(async () => {
      const izid = await zacniVklopTotpAction();
      if (izid.ok && izid.data) nastaviQr(izid.data);
      else if (!izid.ok) toast.error(izid.message);
    });
  }

  // ── Vklop: drugi korak ───────────────────────────────────────────────────
  const [izidPotrditve, potrdi, potrjujem] = useActionState<
    ActionResult<{ kode: string[] }> | null,
    FormData
  >(potrdiVklopTotpAction, null);
  const zadnjaPotrditev = useRef<unknown>(null);

  useEffect(() => {
    if (!izidPotrditve || izidPotrditve === zadnjaPotrditev.current) return;
    zadnjaPotrditev.current = izidPotrditve;
    if (izidPotrditve.ok) toast.success(izidPotrditve.message ?? "Vklopljeno.");
    else toast.error(izidPotrditve.message);
  }, [izidPotrditve]);

  // ── Nove rezervne kode ───────────────────────────────────────────────────
  const [izidKod, izdajKode, izdajam] = useActionState<
    ActionResult<{ kode: string[] }> | null,
    FormData
  >(noveRezervneKodeAction, null);
  const zadnjeKode = useRef<unknown>(null);

  useEffect(() => {
    if (!izidKod || izidKod === zadnjeKode.current) return;
    zadnjeKode.current = izidKod;
    if (izidKod.ok) toast.success(izidKod.message ?? "Izdane.");
    else toast.error(izidKod.message);
  }, [izidKod]);

  // ── Izklop ───────────────────────────────────────────────────────────────
  const [izidIzklopa, izklopi, izklapljam] = useActionState<
    ActionResult | null,
    FormData
  >(izklopiTotpAction, null);
  const zadnjiIzklop = useRef<unknown>(null);

  useEffect(() => {
    if (!izidIzklopa || izidIzklopa === zadnjiIzklop.current) return;
    zadnjiIzklop.current = izidIzklopa;
    if (izidIzklopa.ok) toast.success(izidIzklopa.message ?? "Izklopljeno.");
    else toast.error(izidIzklopa.message);
  }, [izidIzklopa]);

  // Zadnji izdani komplet kod — iz vklopa ali iz izdaje novih.
  const kode =
    !skrite && stanje.vklopljena
      ? ((izidKod?.ok ? izidKod.data?.kode : null) ??
        (izidPotrditve?.ok ? izidPotrditve.data?.kode : null) ??
        null)
      : null;

  // Koda QR velja samo, dokler 2FA ni vklopljena; ko se vklopi, stran dobi
  // novo stanje s strežnika in okvir izgine sam.
  const prikaziQr = qr && !stanje.vklopljena;

  return (
    <AdminSection
      icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
      title="Dvofaktorska prijava"
      description="Poleg gesla še koda iz generatorja na telefonu. Geslo, ki ga kdo izve, s tem ni več dovolj."
      action={
        stanje.vklopljena ? (
          <Badge variant="success">Vklopljena</Badge>
        ) : (
          <Badge variant="warning">Izklopljena</Badge>
        )
      }
    >
      {kode ? <SeznamKod kode={kode} onZapri={() => nastaviSkrite(true)} /> : null}

      {/* ── Ni vklopljena ────────────────────────────────────────────── */}
      {!stanje.vklopljena && !prikaziQr ? (
        <div className="grid gap-(--s2)">
          <p className="type-small text-muted max-w-prose">
            Potrebuješ generator na telefonu — Google Authenticator, Aegis, 1Password ali
            podoben. Vklop ima dva koraka: skeniraš kodo in vpišeš prvo šestmestno
            številko.
          </p>
          <div>
            <Button type="button" onClick={zacniVklop} disabled={zacenjam}>
              {zacenjam ? "Pripravljam …" : "Vklopi"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Vklop v teku ─────────────────────────────────────────────── */}
      {prikaziQr ? (
        <div className="grid gap-(--s3) sm:grid-cols-[auto_1fr]">
          <KodaQr naslov={qr.naslov} />

          <div className="grid gap-(--s2)">
            <div>
              <p className="type-small text-text font-medium">1. Skeniraj kodo</p>
              <p className="type-small text-muted">
                Če skeniranje ne gre, v generator prepiši to skrivnost:
              </p>
              <code className="type-small stevilke text-text mt-1 block break-all">
                {qr.skrivnost}
              </code>
            </div>

            <form action={potrdi} className="grid max-w-xs gap-(--s1)" noValidate>
              <FieldGroup
                label="2. Vpiši kodo iz generatorja"
                required
                error={
                  izidPotrditve && !izidPotrditve.ok
                    ? izidPotrditve.fieldErrors?.koda
                    : null
                }
              >
                <Input
                  name="koda"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  className="stevilke tracking-[0.3em]"
                  required
                />
              </FieldGroup>
              <div className="flex gap-2">
                <Button type="submit" disabled={potrjujem}>
                  {potrjujem ? "Preverjam …" : "Dokončaj vklop"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => nastaviQr(null)}>
                  Prekliči
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Vklopljena ───────────────────────────────────────────────── */}
      {stanje.vklopljena && !prikaziQr ? (
        <div className="grid gap-(--s3)">
          <p className="type-small text-muted">
            Preostalih rezervnih kod:{" "}
            <strong className="text-text">{stanje.preostaleKode}</strong>. Vsaka velja
            enkrat.
          </p>

          <form action={izdajKode} className="grid max-w-xs gap-(--s1)" noValidate>
            <FieldGroup
              label="Nov komplet rezervnih kod"
              hint="Stare prenehajo veljati takoj."
              error={izidKod && !izidKod.ok ? izidKod.fieldErrors?.geslo : null}
            >
              <Input
                name="geslo"
                type="password"
                autoComplete="current-password"
                placeholder="Potrdi z geslom"
                required
              />
            </FieldGroup>
            <div>
              <Button type="submit" variant="secondary" disabled={izdajam}>
                {izdajam ? "Izdajam …" : "Izdaj nove kode"}
              </Button>
            </div>
          </form>

          <form action={izklopi} className="grid max-w-xs gap-(--s1)" noValidate>
            <FieldGroup
              label="Izklop dvofaktorske prijave"
              hint="Rezervne kode se ob izklopu zavržejo."
              error={
                izidIzklopa && !izidIzklopa.ok ? izidIzklopa.fieldErrors?.geslo : null
              }
            >
              <Input
                name="geslo"
                type="password"
                autoComplete="current-password"
                placeholder="Potrdi z geslom"
                required
              />
            </FieldGroup>
            <div>
              <Button
                type="submit"
                variant="ghost"
                disabled={izklapljam}
                leftIcon={<ShieldOff className="h-4 w-4" aria-hidden />}
                className="text-danger hover:text-danger"
              >
                {izklapljam ? "Izklapljam …" : "Izklopi"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminSection>
  );
}

// ----------------------------------------------------------------------------
// Koda QR — izriše se na odjemalcu
// ----------------------------------------------------------------------------
// Skrivnost ne sme nikoli nastati kot slika na strežniku: tam bi šla skozi
// dnevnike in predpomnilnike. Knjižnica `qrcode` teče tudi v brskalniku.
// ----------------------------------------------------------------------------

function KodaQr({ naslov }: { naslov: string }) {
  const [slika, nastaviSliko] = useState<string | null>(null);

  useEffect(() => {
    let velja = true;
    void import("qrcode").then(async (q) => {
      const url = await q.toDataURL(naslov, { margin: 2, width: 512 });
      if (velja) nastaviSliko(url);
    });
    return () => {
      velja = false;
    };
  }, [naslov]);

  if (!slika) {
    return <div className="bg-foreground/5 size-44 animate-pulse rounded-lg" />;
  }

  return (
    <Image
      src={slika}
      alt="Koda QR za generator"
      width={176}
      height={176}
      unoptimized
      className="rounded-lg bg-white"
    />
  );
}

// ----------------------------------------------------------------------------
// Rezervne kode — pokažejo se ENKRAT
// ----------------------------------------------------------------------------

function SeznamKod({ kode, onZapri }: { kode: string[]; onZapri: () => void }) {
  async function kopiraj() {
    try {
      await navigator.clipboard.writeText(kode.join("\n"));
      toast.success("Kode so kopirane.");
    } catch {
      toast.error("Kopiranje ni uspelo — prepiši jih ročno.");
    }
  }

  return (
    <div className="border-warning/40 bg-warning-bg mb-(--s3) rounded-xl border p-(--s2)">
      <p className="type-small text-warning-fg font-medium">
        Shrani te kode zdaj — pokažejo se samo enkrat.
      </p>
      <p className="type-small text-muted mt-1">
        V bazi so samo njihovi odtisi, zato jih ni mogoče prikazati znova. Vsaka velja
        enkrat; z njimi se prijaviš, kadar telefona nimaš.
      </p>

      <ul className="stevilke type-small text-text mt-(--s2) grid gap-1 sm:grid-cols-2">
        {kode.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>

      <div className="mt-(--s2) flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={kopiraj}
          leftIcon={<Copy className="h-4 w-4" aria-hidden />}
        >
          Kopiraj vse
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onZapri}>
          Shranil sem jih
        </Button>
      </div>
    </div>
  );
}
