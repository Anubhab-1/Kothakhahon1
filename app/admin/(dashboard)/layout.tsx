import AdminShell from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/auth/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AdminShell
      session={{
        email: session.email,
        fullName: session.fullName,
      }}
    >
      {children}
    </AdminShell>
  );
}
