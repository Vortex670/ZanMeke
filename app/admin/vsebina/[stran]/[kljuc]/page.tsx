import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { BlokForm } from "@/components/admin/domov/BlokForm";
import { BlokShema } from "@/components/admin/domov/BlokShema";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Button } from "@/components/ui/Button";
import { getBlok } from "@/lib/domov/queries";
import { jeStran, STRAN_NAPIS } from "@/lib/domov/bloki";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ stran: string; kljuc: string }> };

export default async function UrediBlokPage({ params }: Props) {
  const { stran, kljuc } = await params;
  if (!jeStran(stran)) notFound();
  const blok = await getBlok(stran, kljuc);
  if (!blok || blok.def.polja.length === 0) notFound();

  return (
    <AdminPage
      eyebrow={`${STRAN_NAPIS[stran]} · Odsek`}
      title={
        <span className="flex items-center gap-(--s3)">
          <BlokShema kljuc={blok.def.kljuc} />
          {blok.def.ime}
        </span>
      }
      description={blok.def.opis}
      backHref={`/admin/vsebina/${stran}`}
      backLabel={STRAN_NAPIS[stran]}
      actions={
        <Button
          as="a"
          href="/"
          target="_blank"
          variant="secondary"
          size="sm"
          leftIcon={<ExternalLink className="h-4 w-4" aria-hidden />}
        >
          Odpri stran
        </Button>
      }
    >
      <BlokForm
        stran={stran}
        def={blok.def}
        initial={blok.data}
        backHref={`/admin/vsebina/${stran}`}
      />
    </AdminPage>
  );
}
