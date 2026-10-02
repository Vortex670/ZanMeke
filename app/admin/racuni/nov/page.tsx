import { AdminPage } from "@/components/admin/shell/AdminPage";
import { RacunForm } from "@/components/admin/racuni/RacunForm";

export const dynamic = "force-dynamic";

export default function NovRacun() {
  return (
    <AdminPage
      eyebrow="Računi"
      title="Nov račun"
      description="Račun nastane kot osnutek. Povezavo do plačila pošlješ ti — stran je ne pošilja sama."
      backHref="/admin/racuni"
      backLabel="Računi"
    >
      <RacunForm />
    </AdminPage>
  );
}
