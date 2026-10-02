import { PageForm } from "@/components/admin/strani/PageForm";
import { AdminPage } from "@/components/admin/shell/AdminPage";

export const dynamic = "force-dynamic";

export default function NovaStranPage() {
  return (
    <AdminPage
      eyebrow="Strani"
      title="Nova stran"
      description="Dokler je osnutek, je ne vidi nihče razen tebe."
      backHref="/admin/strani"
      backLabel="Strani"
    >
      <PageForm />
    </AdminPage>
  );
}
