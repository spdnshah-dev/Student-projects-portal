import type { Role } from "@prisma/client";

/** Where each role lands after signing in. */
export function roleHome(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super";
    case "ADMIN":
      return "/admin";
    case "STUDENT":
      return "/dashboard";
    default:
      return "/";
  }
}

export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
