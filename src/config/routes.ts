export const ROLE_HOME = {
  SYSTEM_ADMIN: "/admin",
  EMPLOYEE: "/employee",
  GROUP_VIEWER: "/group",
  COMPANY_VIEWER: "/company",
  PROJECT_VIEWER: "/project",
} as const;

export type UserRole = keyof typeof ROLE_HOME;
