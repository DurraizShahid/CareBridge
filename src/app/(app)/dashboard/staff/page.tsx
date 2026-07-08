import { permanentRedirect } from "next/navigation";

export default function StaffDashboardRedirect() {
  permanentRedirect("/dashboard");
}
