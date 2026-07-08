import { DashboardGuard } from "@/components/auth/dashboard-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
