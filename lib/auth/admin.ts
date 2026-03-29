import { createSession, clearSession, getSession, requireRole, type AuthSession } from "@/lib/auth/session";

export interface AdminSession extends AuthSession {
  adminId: string;
}

export async function createAdminSession(admin: {
  id: string;
  email: string;
  fullName?: string | null;
}) {
  return createSession({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: "ADMIN",
  });
}

export async function clearAdminSession() {
  return clearSession();
}

export async function getAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return null;
  }

  return {
    ...session,
    adminId: session.userId,
  };
}

export async function requireAdminSession() {
  const session = await requireRole("ADMIN", "/admin");
  return {
    ...session,
    adminId: session.userId,
  };
}
