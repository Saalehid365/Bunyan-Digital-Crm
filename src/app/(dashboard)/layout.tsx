import { requireUser, getUserPermissions } from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // ADMIN is always full-access regardless of this list — only fetched so MEMBER's
  // sidebar can show exactly the sections they've been granted.
  const permissions = user.role === "ADMIN" ? [] : await getUserPermissions(user.id);

  return (
    <DashboardShell role={user.role} name={user.name} email={user.email!} permissions={permissions}>
      {children}
    </DashboardShell>
  );
}
