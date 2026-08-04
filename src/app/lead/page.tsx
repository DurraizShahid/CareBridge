import type { Metadata } from "next";
import { LeadGenClient } from "./lead-gen-client";

export const metadata: Metadata = {
  title: "Request a CareBridge walkthrough",
  description:
    "Book a product walkthrough for hospital discharge teams and post-acute facilities.",
};

export default function LeadPage() {
  return <LeadGenClient />;
}
