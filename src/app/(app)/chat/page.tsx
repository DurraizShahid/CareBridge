import { redirect } from "next/navigation";
import { AuthorizationError, getServerOrganization } from "@/lib/server-organization";
import { HOSPITAL_ROLES } from "@/lib/permissions";
import { ChatWorkspace } from "@/components/ai/chat-workspace";

export const dynamic = "force-dynamic";

// Hospital home. Every sign-in lands here; other roles continue to their dashboard.
export default async function ChatPage() {
  const org = await getServerOrganization().catch((err) => {
    if (err instanceof AuthorizationError) redirect("/onboarding");
    throw err;
  });
  if (!org?.organizationId) redirect("/onboarding");
  if (!HOSPITAL_ROLES.includes(org.role)) redirect("/dashboard");
  return <ChatWorkspace />;
}
