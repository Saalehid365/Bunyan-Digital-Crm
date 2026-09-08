import { requireUser } from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell role={user.role} name={user.name} email={user.email!}>
      {children}
    </DashboardShell>
  );
}
