import type { User, UserRole } from "@/types";

export type UserAccountStatus = "active" | "banned" | "locked";
export type UserDatabaseStatus = "linked" | "missing";

export type DashboardUser = User & {
  accountStatus: UserAccountStatus;
  databaseStatus: UserDatabaseStatus;
  clerkCreatedAt: string;
  clerkUpdatedAt: string;
  dbCreatedAt: string | null;
  dbUpdatedAt: string | null;
  lastActiveAt: string | null;
  lastSignInAt: string | null;
};

export type UserFormValues = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  title: string;
  department: string;
  hospitalId: string;
  phone: string;
};

export type UserActionState = {
  status: "idle" | "success" | "error";
  message: string;
};
