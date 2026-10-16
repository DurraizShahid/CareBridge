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
  RiCloseLine,
  RiShieldCheckLine,
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
import { StatCard } from "@/components/ui/stat-card";
import { DocumentsPageSkeleton } from "@/components/dashboard-skeletons";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { cn } from "@/lib/utils";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDocs(), fetchStats()]);
    setIsRefreshing(false);
  };

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

  const handleClearFilters = () => {
    setQuery("");
    setCategory("all");
    setArchived(false);
    setPage(1);
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    fetchDocs();
    fetchStats();
  };

  const hasActiveFilters = Boolean(query || category !== "all" || archived);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading && docs.length === 0 && !error) {
    return <DocumentsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Page Header ── */}
      <PageHeader
        title="Documentation Vault"
        description="HIPAA-compliant document storage, verified transfer packets, and compliance audit trail."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documentation Vault" },
        ]}
      >
        {canUpload && (
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-sm"
            onClick={() => setUploadOpen(true)}
          >
            <RiUploadCloud2Line className="size-4 mr-1.5" />
            Upload Document
          </Button>
        )}
      </PageHeader>

      {/* ── Status Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {todayFormatted}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <RiShieldCheckLine className="size-3.5 text-[#245C52]" />
          HIPAA Compliant &middot; AES-256
        </div>
        {canAudit && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            Immutable Audit Logging Active
          </span>
        )}
      </div>

      {/* ── Stats Cards Grid ── */}
      <section aria-labelledby="documents-kpi-heading" className="flex flex-col gap-3">
        <h2 id="documents-kpi-heading" className="sr-only">
          Documentation Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-5">
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">
                  Total Records
                </span>
                <div className="size-8 rounded-full bg-[#EDF2EC] text-[#245C52] flex items-center justify-center shrink-0">
                  <RiFileTextLine className="size-4" />
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-[#0D1B17] tracking-tight tabular-nums">
                {stats?.totalDocuments ?? totalCount}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-5">
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">
                  Storage Footprint
                </span>
                <div className="size-8 rounded-full bg-[#255DCE]/10 text-[#255DCE] flex items-center justify-center shrink-0">
                  <RiHardDriveLine className="size-4" />
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-[#0D1B17] tracking-tight tabular-nums">
                {stats?.totalSize != null ? formatBytes(stats.totalSize) : "—"}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-5">
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">
                  Recent Uploads (7d)
                </span>
                <div className="size-8 rounded-full bg-[#EDF2EC] text-[#245C52] flex items-center justify-center shrink-0">
                  <RiTimeLine className="size-4" />
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-[#0D1B17] tracking-tight tabular-nums">
                {stats?.recentUploads ?? "—"}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-5">
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">
                  Expiring Soon (30d)
                </span>
                <div className="size-8 rounded-full bg-[#C05621]/10 text-[#C05621] flex items-center justify-center shrink-0">
                  <RiAlertLine className="size-4" />
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-[#0D1B17] tracking-tight tabular-nums">
                {stats?.expiringSoon ?? 0}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-5">
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">
                  Archived Records
                </span>
                <div className="size-8 rounded-full bg-[#EDF2EC] text-[#53665E] flex items-center justify-center shrink-0">
                  <RiArchiveLine className="size-4" />
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-[#0D1B17] tracking-tight tabular-nums">
                {stats?.archivedCount ?? 0}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Search & Filters Control Card ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE5DE] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#53665E]" />
            <Input
              placeholder="Search by title, description, file name, or tags..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10 rounded-full border-[#DCE5DE] bg-[#FAFBF8] text-sm text-[#0D1B17] placeholder:text-[#53665E] focus-visible:ring-1 focus-visible:ring-[#245C52]"
            />
          </div>

          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-10 w-full md:w-56 rounded-full border-[#DCE5DE] bg-[#FAFBF8] text-xs font-medium text-[#203E39]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#DCE5DE] bg-white">
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 rounded-full px-4 text-xs font-semibold transition-all gap-1.5",
              archived
                ? "bg-[#245C52] text-white border-transparent hover:bg-[#19473F]"
                : "bg-[#FAFBF8] text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC]",
            )}
            onClick={() => {
              setArchived((v) => !v);
              setPage(1);
            }}
          >
            <RiArchiveLine className="size-3.5" />
            {archived ? "Showing Archived" : "Show Archived"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="size-10 rounded-full text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC] shrink-0"
            aria-label="Refresh Documents"
          >
            <RiRefreshLine
              className={cn("size-4 transition-transform duration-500", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        {/* Filter Pills if filters active */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#DCE5DE]/60 text-xs">
            <span className="text-[#53665E] font-medium">Active filters:</span>
            {query && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                Search: &ldquo;{query}&rdquo;
                <button
                  type="button"
                  onClick={() => handleSearch("")}
                  className="hover:text-[#0D1B17] ml-0.5"
                  aria-label="Remove search filter"
                >
                  <RiCloseLine className="size-3" />
                </button>
              </span>
            )}
            {category !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                Category: {CATEGORY_OPTIONS.find((c) => c.value === category)?.label}
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className="hover:text-[#0D1B17] ml-0.5"
                  aria-label="Remove category filter"
                >
                  <RiCloseLine className="size-3" />
                </button>
              </span>
            )}
            {archived && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                Archived only
                <button
                  type="button"
                  onClick={() => setArchived(false)}
                  className="hover:text-[#0D1B17] ml-0.5"
                  aria-label="Remove archived filter"
                >
                  <RiCloseLine className="size-3" />
                </button>
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              onClick={handleClearFilters}
              className="h-auto p-0 text-xs font-semibold text-[#245C52] hover:text-[#19473F] ml-auto"
            >
              Reset all filters
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="rounded-2xl border-[#A33632]/40 bg-[#FAEEEB] p-4 text-sm text-[#A33632]">
          <CardContent className="p-0 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="link"
              size="sm"
              onClick={fetchDocs}
              className="text-xs font-semibold text-[#A33632] underline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Document Table Component ── */}
      <DocumentTable
        documents={docs}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        canDelete={canDelete}
        onRefresh={fetchDocs}
        organizationId={organizationId}
        onUploadClick={() => setUploadOpen(true)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Pagination Bar ── */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 text-xs">
          <p className="text-[#53665E]">
            Showing <span className="font-semibold text-[#0D1B17]">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-[#0D1B17]">{Math.min(page * pageSize, totalCount)}</span> of{" "}
            <span className="font-semibold text-[#0D1B17]">{totalCount}</span> documents
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 rounded-full border-[#DCE5DE] bg-white px-3 text-xs text-[#203E39] disabled:opacity-40 hover:bg-[#EDF2EC]"
            >
              Previous
            </Button>
            {pageNumbers.map((num) => (
              <Button
                key={num}
                variant={page === num ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(num)}
                className={cn(
                  "size-8 rounded-full text-xs font-semibold p-0",
                  page === num
                    ? "bg-[#245C52] text-white border-transparent"
                    : "border-[#DCE5DE] bg-white text-[#203E39] hover:bg-[#EDF2EC]",
                )}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 rounded-full border-[#DCE5DE] bg-white px-3 text-xs text-[#203E39] disabled:opacity-40 hover:bg-[#EDF2EC]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Document Upload Dialog ── */}
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
        organizationId={organizationId}
      />
    </div>
  );
}
