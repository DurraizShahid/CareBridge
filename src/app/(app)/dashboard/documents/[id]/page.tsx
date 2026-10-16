import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { resolveRole, roleHasPermission } from "@/lib/permissions";
import { getDocument, logDocumentAccess } from "@/lib/data-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RiArrowLeftLine } from "@remixicon/react";
import {
  FileText,
  Calendar,
  Clock,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  User,
  Tag,
  ChevronRight,
} from "lucide-react";
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

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  "patient-records": "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  "medical-documentation": "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  "consent-forms": "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  "insurance-documents": "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  "compliance-documents": "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
  policies: "bg-[#FAFBF8] text-[#53665E] border border-[#DCE5DE]",
  procedures: "bg-[#245C52]/10 text-[#245C52] border border-[#245C52]/20",
  "audit-documents": "bg-[#0D1B17] text-white border border-[#0D1B17]",
  "employee-training-records": "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  "business-associate-agreements": "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  "security-documentation": "bg-[#245C52]/10 text-[#245C52] border border-[#245C52]/20",
  "privacy-documentation": "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  other: "bg-muted text-muted-foreground border border-border",
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

  const document = await getDocument(id, org.organizationId, signedInRole);
  if (!document) {
    notFound();
  }

  // Record read audit log
  await logDocumentAccess({
    documentId: id,
    userId: signedInUser.id,
    action: "VIEW",
  }).catch(() => {
    // Non-fatal
  });

  const uploaderName = document.uploadedBy
    ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`.trim()
    : "System Service";

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Breadcrumb Navigation ── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#53665E]">
        <Link href="/dashboard" className="hover:text-[#0D1B17] transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-3.5 text-[#53665E]/50" />
        <Link href="/dashboard/documents" className="hover:text-[#0D1B17] transition-colors">
          Documentation Vault
        </Link>
        <ChevronRight className="size-3.5 text-[#53665E]/50" />
        <span className="text-[#0D1B17] font-medium truncate max-w-xs">{document.title}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full border-[#DCE5DE] bg-white text-[#203E39] hover:bg-[#EDF2EC] shrink-0"
            render={<Link href="/dashboard/documents" />}
            aria-label="Back to documentation vault"
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#0D1B17] tracking-tight truncate">
              {document.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#53665E]">
              <span
                className={
                  CATEGORY_COLORS[document.category] ??
                  "bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full"
                }
              >
                {CATEGORY_LABELS[document.category] ?? document.category}
              </span>
              <span>&middot;</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
                Revision v{document.version}
              </span>
              <span>&middot;</span>
              <span className="tabular-nums">{formatBytes(document.fileSize)}</span>
              <span>&middot;</span>
              <span>Created {formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Content and Metadata Sidebar ── */}
      <div className="grid gap-6 xl:grid-cols-12 items-start">
        {/* Left: Actions, Tabs, Versions, Logs */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <DocumentDetailClient
            documentId={document.id}
            document={document}
            canDelete={canDelete}
            canAudit={canAudit}
          />
        </div>

        {/* Right: Technical Document Dossier Sidebar */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <CardTitle className="font-serif text-lg font-normal text-[#0D1B17]">
                Document Profile
              </CardTitle>
              <CardDescription className="text-xs text-[#53665E]">
                Classification, storage parameters, and retention terms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4 text-xs">
              {/* Description */}
              {document.description && (
                <div className="space-y-1">
                  <span className="font-medium text-[#53665E]">Clinical Summary</span>
                  <p className="text-[#0D1B17] leading-relaxed bg-[#FAFBF8] p-3 rounded-xl border border-[#DCE5DE]">
                    {document.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {document.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-medium text-[#53665E]">Metadata Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]"
                      >
                        <Tag className="size-2.5 mr-1 text-[#245C52]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-[#DCE5DE]/60" />

              {/* Technical Specifications Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Original File</span>
                  <p className="font-medium text-[#0D1B17] truncate" title={document.fileName}>
                    {document.fileName}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Payload Type</span>
                  <p className="font-medium text-[#0D1B17] truncate">{document.mimeType}</p>
                </div>
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Exact Size</span>
                  <p className="font-medium text-[#0D1B17] tabular-nums">
                    {formatBytes(document.fileSize)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Uploaded By</span>
                  <p className="font-medium text-[#0D1B17] truncate">{uploaderName}</p>
                </div>
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Registration</span>
                  <p className="font-medium text-[#0D1B17] tabular-nums">
                    {formatDate(document.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-[#53665E] block mb-0.5">Revision</span>
                  <p className="font-medium text-[#0D1B17]">v{document.version}</p>
                </div>
              </div>

              {/* Notes */}
              {document.notes && (
                <>
                  <Separator className="bg-[#DCE5DE]/60" />
                  <div className="space-y-1">
                    <span className="font-medium text-[#53665E]">Compliance &amp; Custody Notes</span>
                    <p className="text-[#0D1B17] leading-relaxed bg-[#FAFBF8] p-3 rounded-xl border border-[#DCE5DE]">
                      {document.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Retention & Expiration */}
              {(document.retentionDate || document.expiresAt) && (
                <>
                  <Separator className="bg-[#DCE5DE]/60" />
                  <div className="grid grid-cols-2 gap-3">
                    {document.retentionDate && (
                      <div className="p-2.5 rounded-xl bg-[#EDF2EC]/60 border border-[#DCE5DE]">
                        <span className="font-medium text-[#53665E] block text-[11px]">
                          Retention Date
                        </span>
                        <p className="font-semibold text-[#203E39] mt-0.5">
                          {formatDate(document.retentionDate)}
                        </p>
                      </div>
                    )}
                    {document.expiresAt && (
                      <div className="p-2.5 rounded-xl bg-[#FAEEEB] border border-[#A33632]/20">
                        <span className="font-medium text-[#A33632] block text-[11px]">
                          Expiration Date
                        </span>
                        <p className="font-semibold text-[#A33632] mt-0.5">
                          {formatDate(document.expiresAt)}
                        </p>
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
