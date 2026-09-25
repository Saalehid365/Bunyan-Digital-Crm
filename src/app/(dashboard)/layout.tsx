import { requireUser, getUserPermissions, getVisibleClientIds } from "@/lib/permissions";
import { getDueSoonJobs } from "@/lib/due-soon-jobs";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // ADMIN is always full-access regardless of this list — only fetched so MEMBER's
  // sidebar can show exactly the sections they've been granted.
  const permissions = user.role === "ADMIN" ? [] : await getUserPermissions(user.id);
  const clientIds = user.role === "ADMIN" ? undefined : await getVisibleClientIds(user.id);
  const dueSoonJobs = await getDueSoonJobs(clientIds);

  const newApplications =
    user.role === "ADMIN" ? await prisma.revenueFinderApplication.count({ where: { status: "NEW" } }) : 0;

  return (
    <DashboardShell
      role={user.role}
      name={user.name}
      email={user.email!}
      permissions={permissions}
      dueSoonJobs={dueSoonJobs}
      newApplications={newApplications}
    >
      {children}
    </DashboardShell>
  );
}
