"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiUploadCloud2Line,
  RiSearchLine,
  RiRefreshLine,
  RiFileTextLine,
  RiHardDriveLine,
  RiTimeLine,
  RiAlertLine,
  RiArchiveLine,
} from "@remixicon/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentsPageSkeleton } from "@/components/dashboard-skeletons";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { Document, DocumentCategory, DocumentStats } from "@/types";

const CATEGORY_OPTIONS: { value: DocumentCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "patient-records", label: "Patient Records" },
  { value: "medical-documentation", label: "Medical Documentation" },
  { value: "consent-forms", label: "Consent Forms" },
  { value: "insurance-documents", label: "Insurance Documents" },
  { value: "compliance-documents", label: "Compliance Documents" },
  { value: "policies", label: "Policies" },
  { value: "procedures", label: "Procedures" },
  { value: "audit-documents", label: "Audit Documents" },
  { value: "employee-training-records", label: "Employee Training Records" },
  { value: "business-associate-agreements", label: "Business Associate Agreements" },
  { value: "security-documentation", label: "Security Documentation" },
  { value: "privacy-documentation", label: "Privacy Documentation" },
  { value: "other", label: "Other" },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface DocumentsPageClientProps {
  organizationId: string;
  canUpload: boolean;
  canDelete: boolean;
  canAudit: boolean;
}

export function DocumentsPageClient({
  organizationId,
  canUpload,
  canDelete,
  canAudit,
}: DocumentsPageClientProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "all") params.set("category", category);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (archived) params.set("isArchived", "true");

      const res = await fetch(`/api/documents?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
      const body = await res.json();
      setDocs(body.data ?? []);
      setTotalCount(body.pagination?.total ?? body.data?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [query, category, page, pageSize, sortBy, sortOrder, archived]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | null) => {
    setCategory((value ?? "all") as DocumentCategory | "all");
    setPage(1);
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    fetchDocs();
    fetchStats();
  };

  if (loading && docs.length === 0 && !error) {
    return <DocumentsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentation Vault"
        description="HIPAA-compliant document storage and management for your organization."
      >
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>
            <RiUploadCloud2Line data-icon="inline-start" />
            Upload Document
          </Button>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Documents
              </span>
              <RiFileTextLine className="size-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              {stats?.totalDocuments ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Size
              </span>
              <RiHardDriveLine className="size-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              {stats?.totalSize != null ? formatBytes(stats.totalSize) : "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Recent Uploads
              </span>
              <RiTimeLine className="size-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              {stats?.recentUploads ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Expiring Soon
              </span>
              <RiAlertLine className="size-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              {stats?.expiringSoon ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Archived
              </span>
              <RiArchiveLine className="size-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              {stats?.archivedCount ?? "—"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card/70 backdrop-blur-xl rounded-xl border-border/60 shadow-sm p-4">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents by title, description, or tags..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-9 w-full md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={archived ? "default" : "outline"}
          size="sm"
          onClick={() => { setArchived((v) => !v); setPage(1); }}
          className="h-9 gap-2"
        >
          <RiArchiveLine className="size-4" />
          {archived ? "Showing Archived" : "Show Archived"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { fetchDocs(); fetchStats(); }}
          className="h-9 w-9 shrink-0"
          aria-label="Refresh"
        >
          <RiRefreshLine className="size-4" />
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
            <Button variant="link" size="sm" onClick={fetchDocs} className="ml-2 h-auto p-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document Table */}
      <DocumentTable
        documents={docs}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        canDelete={canDelete}
        onRefresh={fetchDocs}
        organizationId={organizationId}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} documents
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            {pageNumbers.map((num) => (
              <Button
                key={num}
                variant={page === num ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(num)}
                className="min-w-9"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
        organizationId={organizationId}
      />
    </div>
  );
}
