import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { resolveRole, roleHasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RiArrowLeftLine } from "@remixicon/react";
import { DocumentDetailClient } from "./document-detail-client";
import type { Document, DocumentCategory } from "@/types";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  "patient-records": "Patient Records",
  "medical-documentation": "Medical Documentation",
  "consent-forms": "Consent Forms",
  "insurance-documents": "Insurance Documents",
  "compliance-documents": "Compliance Documents",
  policies: "Policies",
  procedures: "Procedures",
  "audit-documents": "Audit Documents",
  "employee-training-records": "Employee Training Records",
  "business-associate-agreements": "Business Associate Agreements",
  "security-documentation": "Security Documentation",
  "privacy-documentation": "Privacy Documentation",
  other: "Other",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;

  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");

  const signedInDbUser = await prisma.user.findUnique({
    where: { id: signedInUser.id },
  });
  const signedInRole = resolveRole(
    signedInDbUser?.role,
    signedInUser.publicMetadata.role,
  );
  if (!roleHasPermission(signedInRole, "documents:read")) {
    redirect("/dashboard");
  }

  const canDelete = roleHasPermission(signedInRole, "documents:delete");
  const canAudit = roleHasPermission(signedInRole, "documents:audit");

  let document: Document | null = null;
  let fetchError = false;

  try {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = process.env.VERCEL_URL ?? "localhost:3000";
    const res = await fetch(`${protocol}://${host}/api/documents/${id}`, {
      cache: "no-store",
    });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error("Failed to fetch document");
    document = await res.json();
  } catch {
    fetchError = true;
  }

  if (fetchError || !document) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/dashboard/documents" />}>
            <RiArrowLeftLine className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Document not found</h1>
            <p className="text-sm text-muted-foreground">
              The document could not be loaded. It may have been deleted or you may not have access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const uploaderName = document.uploadedBy
    ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`.trim()
    : "Unknown";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/documents" />}>
          <RiArrowLeftLine className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {document.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_LABELS[document.category]} &middot; v{document.version} &middot;{" "}
            {formatBytes(document.fileSize)}
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Main content area */}
        <div className="space-y-6 xl:col-span-2">
          <DocumentDetailClient
            documentId={document.id}
            document={document}
            canDelete={canDelete}
            canAudit={canAudit}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Category</span>
                <Badge variant="secondary" className="block w-fit">
                  {CATEGORY_LABELS[document.category]}
                </Badge>
              </div>

              {document.tags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {document.description && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  <p className="text-sm text-foreground">{document.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">File Name</span>
                  <p className="truncate">{document.fileName}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">File Type</span>
                  <p>{document.mimeType}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">File Size</span>
                  <p>{formatBytes(document.fileSize)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Version</span>
                  <p>v{document.version}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Uploaded By</span>
                  <p>{uploaderName}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Created</span>
                  <p>{formatDate(document.createdAt)}</p>
                </div>
              </div>

              {document.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Notes</span>
                    <p className="text-sm text-foreground">{document.notes}</p>
                  </div>
                </>
              )}

              {(document.retentionDate || document.expiresAt) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {document.retentionDate && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Retention Date</span>
                        <p>{formatDate(document.retentionDate)}</p>
                      </div>
                    )}
                    {document.expiresAt && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Expiration</span>
                        <p>{formatDate(document.expiresAt)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
