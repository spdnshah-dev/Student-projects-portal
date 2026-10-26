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
    case "RECRUITER":
      // Recruiters browse the public portal like a visitor.
      return "/";
    default:
      return "/";
  }
}

export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
