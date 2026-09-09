import { ForbiddenException } from "@nestjs/common";
import type { UserSession } from "@thallesp/nestjs-better-auth";

export function requireAdmin(session: UserSession) {
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    throw new ForbiddenException("admin only");
  }
}
