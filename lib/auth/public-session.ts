import type { UserRole } from "@/generated/prisma/client";

export interface PublicSessionUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
}
