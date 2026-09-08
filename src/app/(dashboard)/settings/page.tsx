import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceTypeManager } from "@/components/services/service-type-manager";
import { PasswordForm } from "@/components/settings/password-form";

export default async function SettingsPage() {
  const user = await requireUser();

  const [serviceTypes, dbUser] = await Promise.all([
    user.role === "ADMIN"
      ? prisma.serviceType.findMany({
          where: { isArchived: false },
          orderBy: { order: "asc" },
        })
      : Promise.resolve([]),
    prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="mt-0.5 text-foreground">{user.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-0.5 text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="mt-0.5 text-foreground">{user.role === "ADMIN" ? "Admin" : "Team member"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Password sign-in</CardTitle>
          <CardDescription>
            Set a password to sign in directly, instead of waiting for an emailed link each time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm hasPassword={Boolean(dbUser?.passwordHash)} />
        </CardContent>
      </Card>

      {user.role === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Service catalog</CardTitle>
            <CardDescription>
              The services you offer, e.g. eBay management, website management. Attach these to clients from their Services tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTypeManager serviceTypes={serviceTypes} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
