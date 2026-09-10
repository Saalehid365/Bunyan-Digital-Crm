import { requirePermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";

export default async function NewClientPage() {
  await requirePermission("MANAGE_CLIENTS");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">New client</h1>
        <p className="text-sm text-muted-foreground">
          Add the client&apos;s details. You can attach services and start tracking work next.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Client details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
