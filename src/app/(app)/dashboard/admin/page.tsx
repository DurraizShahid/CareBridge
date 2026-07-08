import { permanentRedirect } from "next/navigation";

export default function AdminDashboardRedirect() {
  permanentRedirect("/dashboard");
}
