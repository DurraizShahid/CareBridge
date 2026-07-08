import { permanentRedirect } from "next/navigation";

export default function FacilityDashboardRedirect() {
  permanentRedirect("/dashboard");
}
