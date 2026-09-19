import type { Role } from "./types";

export function homeRouteForRole(role: Role): string {
  switch (role) {
    case "admin":
    case "department_officer":
      return "/dashboard";
    case "field_officer":
      return "/incidents";
    case "citizen":
      return "/complaints/new";
    default:
      return "/login";
  }
}
