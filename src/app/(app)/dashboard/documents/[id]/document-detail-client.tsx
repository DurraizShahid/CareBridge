"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  Document,
  DocumentAccessLog,
  DocumentAccessAction,
  DocumentVersion,
  DocumentCategory,
} from "@/types";

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "patient-records", label: "Patient Records" },
  { value: "medical-documentation", label: "Medical Documentation" },
  { value: "consent-forms", label: "Consent Forms" },
  { value: "insurance-documents", label: "Insurance Documents" },
  { value: "compliance-documents", label: "Compliance Documents" },
  { value: "policies", label: "Policies" },
  { value: "procedures", label: "Procedures" },
  { value: "audit-documents", label: "Audit Documents" },
  { value: "employee-training-records", label: "Training Records" },
  { value: "business-associate-agreements", label: "BAA Agreements" },
  { value: "security-documentation", label: "Security Docs" },
  { value: "privacy-documentation", label: "Privacy Docs" },
  { value: "other", label: "Other" },
];

const ACTION_LABELS: Record<DocumentAccessAction, string> = {
  VIEW: "View",
  DOWNLOAD: "Download",
  UPLOAD: "Upload",
  UPDATE: "Update",
  DELETE: "Delete",
  SHARE: "Share",
  EXPORT: "Export",
  ARCHIVE: "Archive",
  RESTORE: "Restore",
};

const ACTION_STYLES: Record<DocumentAccessAction, string> = {
  VIEW: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  DOWNLOAD: "bg-[#245C52]/10 text-[#245C52] border border-[#245C52]/20",
  UPLOAD: "bg-[#245C52]/10 text-[#245C52] border border-[#245C52]/20",
  UPDATE: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  DELETE: "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
  SHARE: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  EXPORT: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  ARCHIVE: "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
  RESTORE: "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const versionColumnHelper = createColumnHelper<DocumentVersion>();
const accessLogColumnHelper = createColumnHelper<DocumentAccessLog>();

interface DocumentDetailClientProps {
  documentId: string;
  document: Document;
  canDelete: boolean;
  canAudit: boolean;
}

function DetailSkeleton() {
  return (
    <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-0">
        <Skeleton className="h-6 w-40 bg-[#EDF2EC]" />
        <Skeleton className="h-4 w-full bg-[#EDF2EC]" />
        <Skeleton className="h-4 w-3/4 bg-[#EDF2EC]" />
        <Skeleton className="h-4 w-1/2 bg-[#EDF2EC]" />
      </CardContent>
    </Card>
  );
}

export function DocumentDetailClient({
  documentId,
  document: initialDoc,
  canDelete,
  canAudit,
}: DocumentDetailClientProps) {
  const [doc, setDoc] = useState<Document>(initialDoc);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [accessLogs, setAccessLogs] = useState<DocumentAccessLog[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit Metadata Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(initialDoc.title);
  const [editDescription, setEditDescription] = useState(initialDoc.description ?? "");
  const [editCategory, setEditCategory] = useState<DocumentCategory>(initialDoc.category);
  const [editTags, setEditTags] = useState(initialDoc.tags?.join(", ") ?? "");
  const [editNotes, setEditNotes] = useState(initialDoc.notes ?? "");
  const [editRetentionDate, setEditRetentionDate] = useState(
    initialDoc.retentionDate ? initialDoc.retentionDate.slice(0, 10) : "",
  );
  const [editExpiresAt, setEditExpiresAt] = useState(
    initialDoc.expiresAt ? initialDoc.expiresAt.slice(0, 10) : "",
  );
  const [editLegalHold, setEditLegalHold] = useState(initialDoc.isOnLegalHold ?? false);

  const [versionSorting, setVersionSorting] = useState<SortingState>([
    { id: "version", desc: true },
  ]);
  const [logSorting, setLogSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);

  const fetchVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        setVersions(await res.json());
      }
    } catch {
      toast.error("Failed to load version history");
    } finally {
      setVersionsLoading(false);
    }
  }, [documentId]);

  const fetchAccessLogs = useCallback(
    async (pageNum = 1) => {
      setLogsLoading(true);
      try {
        const res = await fetch(
          `/api/documents/${documentId}/access-logs?page=${pageNum}&pageSize=10`,
        );
        if (res.ok) {
          const body = await res.json();
          setAccessLogs(body.data ?? []);
          setLogsTotal(body.pagination?.total ?? body.data?.length ?? 0);
          setLogsPage(pageNum);
        }
      } catch {
        toast.error("Failed to load access logs");
      } finally {
        setLogsLoading(false);
      }
    },
    [documentId],
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (canAudit) fetchAccessLogs(1);
  }, [canAudit, fetchAccessLogs]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = doc.fileName || "document";
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started");
      if (canAudit) fetchAccessLogs(logsPage);
    } catch {
      toast.error("Failed to download document");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Document deleted");
      window.location.href = "/dashboard/documents";
    } catch {
      toast.error("Failed to delete document");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const parsedTags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          category: editCategory,
          tags: parsedTags,
          notes: editNotes.trim() || undefined,
          retentionDate: editRetentionDate ? new Date(editRetentionDate).toISOString() : undefined,
          expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined,
          isOnLegalHold: editLegalHold,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to update metadata");
      }

      const updated = await res.json();
      setDoc(updated);
      toast.success("Metadata updated successfully");
      setEditOpen(false);
      if (canAudit) fetchAccessLogs(logsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setSavingEdit(false);
    }
  };

  const versionColumns = useMemo(
    () => [
      versionColumnHelper.accessor("version", {
        header: "Version",
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
            v{info.getValue()}
          </span>
        ),
      }),
      versionColumnHelper.accessor("fileName", {
        header: "File Name",
        cell: (info) => (
          <span className="text-xs font-medium text-[#0D1B17]">
            {info.getValue()}
          </span>
        ),
      }),
      versionColumnHelper.accessor("fileSize", {
        header: "Size",
        cell: (info) => (
          <span className="text-xs text-[#53665E] tabular-nums whitespace-nowrap">
            {formatBytes(info.getValue())}
          </span>
        ),
      }),
      versionColumnHelper.display({
        id: "uploadedBy",
        header: "Uploaded By",
        cell: (info) => {
          const v = info.row.original;
          const name = v.uploadedBy
            ? `${v.uploadedBy.firstName} ${v.uploadedBy.lastName}`.trim()
            : "System Service";
          return <span className="text-xs text-[#53665E]">{name}</span>;
        },
      }),
      versionColumnHelper.accessor("createdAt", {
        header: "Uploaded At",
        cell: (info) => (
          <span className="text-xs text-[#53665E] tabular-nums whitespace-nowrap">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
    ],
    [],
  );

  const logColumns = useMemo(
    () => [
      accessLogColumnHelper.display({
        id: "user",
        header: "Identity",
        cell: (info) => {
          const log = info.row.original;
          const name = log.user
            ? `${log.user.firstName} ${log.user.lastName}`.trim()
            : log.userId;
          return (
            <span className="text-xs font-semibold text-[#0D1B17]">
              {name || "System"}
            </span>
          );
        },
      }),
      accessLogColumnHelper.accessor("action", {
        header: "Action",
        cell: (info) => {
          const action = info.getValue();
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                ACTION_STYLES[action] ?? "bg-muted text-muted-foreground",
              )}
            >
              {ACTION_LABELS[action] ?? action}
            </span>
          );
        },
      }),
      accessLogColumnHelper.accessor("details", {
        header: "Audit Note",
        cell: (info) => (
          <span className="text-xs text-[#53665E]">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      accessLogColumnHelper.accessor("ipAddress", {
        header: "IP Address",
        cell: (info) => (
          <span className="text-xs font-mono text-[#53665E]">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      accessLogColumnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: (info) => (
          <span className="text-xs text-[#53665E] tabular-nums whitespace-nowrap">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
    ],
    [],
  );

  const versionTable = useReactTable({
    data: versions,
    columns: versionColumns,
    state: { sorting: versionSorting },
    onSortingChange: setVersionSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const logTable = useReactTable({
    data: accessLogs,
    columns: logColumns,
    state: { sorting: logSorting },
    onSortingChange: setLogSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const logTotalPages = Math.max(1, Math.ceil(logsTotal / 10));

  return (
    <>
      {/* ── Action Buttons Bar ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-sm gap-1.5"
        >
          <Download className="size-3.5" />
          {downloading ? "Preparing..." : "Download File"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditTitle(doc.title);
            setEditDescription(doc.description ?? "");
            setEditCategory(doc.category);
            setEditTags(doc.tags?.join(", ") ?? "");
            setEditNotes(doc.notes ?? "");
            setEditRetentionDate(doc.retentionDate ? doc.retentionDate.slice(0, 10) : "");
            setEditExpiresAt(doc.expiresAt ? doc.expiresAt.slice(0, 10) : "");
            setEditLegalHold(doc.isOnLegalHold ?? false);
            setEditOpen(true);
          }}
          className="rounded-full border-[#DCE5DE] bg-white px-4 text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
        >
          <Edit3 className="size-3.5 text-[#245C52]" />
          Edit Metadata
        </Button>

        {canDelete && (
          <>
            {deleteConfirm ? (
              <div className="flex items-center gap-2 bg-[#FAEEEB] p-1 rounded-full border border-[#A33632]/20">
                <span className="text-xs font-semibold text-[#A33632] px-2">Permanently delete?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full h-7 px-3 text-xs font-semibold"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-full h-7 px-2.5 text-xs text-[#53665E] hover:bg-white"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="rounded-full px-4 text-xs font-semibold gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Delete Record
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── Document Workspace Tabs ── */}
      <Tabs defaultValue="details" className="w-full mt-2">
        <TabsList className="bg-[#EDF2EC] p-1 rounded-full border border-[#DCE5DE]">
          <TabsTrigger
            value="details"
            className="rounded-full text-xs font-medium px-4 data-[state=active]:bg-[#245C52] data-[state=active]:text-white"
          >
            Overview &amp; Metadata
          </TabsTrigger>
          <TabsTrigger
            value="versions"
            className="rounded-full text-xs font-medium px-4 data-[state=active]:bg-[#245C52] data-[state=active]:text-white gap-1.5"
          >
            Version History
            {versions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {versions.length}
              </span>
            )}
          </TabsTrigger>
          {canAudit && (
            <TabsTrigger
              value="access-log"
              className="rounded-full text-xs font-medium px-4 data-[state=active]:bg-[#245C52] data-[state=active]:text-white gap-1.5"
            >
              Access Audit Log
              {logsTotal > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {logsTotal}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Full Details */}
        <TabsContent value="details" className="mt-5">
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <CardTitle className="font-serif text-xl font-normal text-[#0D1B17]">
                Technical &amp; Compliance Specifications
              </CardTitle>
              <CardDescription className="text-xs text-[#53665E]">
                Immutable storage keys, encryption wrappers, and verification checksums
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">Document Record ID</span>
                  <p className="font-mono text-xs text-[#0D1B17] bg-[#FAFBF8] p-2 rounded-lg border border-[#DCE5DE]">
                    {doc.id}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">Encrypted Storage Key</span>
                  <p className="font-mono text-xs text-[#0D1B17] bg-[#FAFBF8] p-2 rounded-lg border border-[#DCE5DE] truncate">
                    {doc.storageKey}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">Last Updated</span>
                  <p className="text-xs text-[#0D1B17] font-medium">{formatDate(doc.updatedAt)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">Archived Status</span>
                  <p className="text-xs text-[#0D1B17] font-medium">
                    {doc.isArchived ? "Archived record" : "Active record"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">Legal Hold</span>
                  <p className="text-xs font-medium">
                    {doc.isOnLegalHold ? (
                      <span className="inline-flex items-center gap-1 text-[#A33632]">
                        <ShieldAlert className="size-3.5" /> Under active legal hold
                      </span>
                    ) : (
                      <span className="text-[#53665E]">Standard retention policy</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#53665E]">MIME Signature</span>
                  <p className="text-xs font-mono text-[#0D1B17]">{doc.mimeType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Version History */}
        <TabsContent value="versions" className="mt-5">
          {versionsLoading ? (
            <DetailSkeleton />
          ) : versions.length === 0 ? (
            <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-8 text-center shadow-sm">
              <FileText className="size-8 mx-auto text-[#53665E]/40 mb-2" />
              <p className="text-sm font-semibold text-[#0D1B17]">No previous revisions</p>
              <p className="text-xs text-[#53665E] mt-1">
                Current record is original v1. Re-uploading will automatically create version increments.
              </p>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-[#DCE5DE] bg-white overflow-hidden py-0 shadow-sm">
              <Table>
                <TableHeader>
                  {versionTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="border-b border-[#DCE5DE] bg-[#FAFBF8]/80">
                      {hg.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#53665E]"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-[#DCE5DE]/60">
                  {versionTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-[#FAFBF8]">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Access Log */}
        {canAudit && (
          <TabsContent value="access-log" className="mt-5">
            {logsLoading ? (
              <DetailSkeleton />
            ) : accessLogs.length === 0 ? (
              <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-8 text-center shadow-sm">
                <ShieldCheck className="size-8 mx-auto text-[#245C52]/50 mb-2" />
                <p className="text-sm font-semibold text-[#0D1B17]">Audit log initialized</p>
                <p className="text-xs text-[#53665E] mt-1">
                  Access operations will be cryptographically logged and displayed here.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                <Card className="rounded-2xl border border-[#DCE5DE] bg-white overflow-hidden py-0 shadow-sm">
                  <Table>
                    <TableHeader>
                      {logTable.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id} className="border-b border-[#DCE5DE] bg-[#FAFBF8]/80">
                          {hg.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#53665E]"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="divide-y divide-[#DCE5DE]/60">
                      {logTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="transition-colors hover:bg-[#FAFBF8]">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                {logTotalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-[#53665E] px-1">
                    <p>
                      Audit page <span className="font-semibold text-[#0D1B17]">{logsPage}</span> of {logTotalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccessLogs(logsPage - 1)}
                        disabled={logsPage <= 1 || logsLoading}
                        className="h-8 rounded-full border-[#DCE5DE] bg-white px-3 text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccessLogs(logsPage + 1)}
                        disabled={logsPage >= logTotalPages || logsLoading}
                        className="h-8 rounded-full border-[#DCE5DE] bg-white px-3 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Edit Metadata Dialog (Replaces dead button) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl border-[#DCE5DE] bg-white p-6 shadow-xl">
          <form onSubmit={handleSaveMetadata} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-normal text-[#0D1B17]">
                Edit Document Metadata
              </DialogTitle>
              <DialogDescription className="text-xs text-[#53665E]">
                Update clinical classification, retention rules, and descriptive tags.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="doc-title" className="text-xs font-medium text-[#203E39]">
                  Document Title *
                </Label>
                <Input
                  id="doc-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="h-9 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="doc-category" className="text-xs font-medium text-[#203E39]">
                  Category *
                </Label>
                <Select
                  value={editCategory}
                  onValueChange={(val) => setEditCategory(val as DocumentCategory)}
                >
                  <SelectTrigger
                    id="doc-category"
                    className="h-9 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#DCE5DE] bg-white">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="doc-desc" className="text-xs font-medium text-[#203E39]">
                  Description
                </Label>
                <Textarea
                  id="doc-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="doc-tags" className="text-xs font-medium text-[#203E39]">
                  Tags (comma separated)
                </Label>
                <Input
                  id="doc-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="transfer, nursing, acute-care"
                  className="h-9 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="doc-retention" className="text-xs font-medium text-[#203E39]">
                    Retention Date
                  </Label>
                  <Input
                    id="doc-retention"
                    type="date"
                    value={editRetentionDate}
                    onChange={(e) => setEditRetentionDate(e.target.value)}
                    className="h-9 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="doc-expires" className="text-xs font-medium text-[#203E39]">
                    Expiration Date
                  </Label>
                  <Input
                    id="doc-expires"
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="h-9 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="doc-notes" className="text-xs font-medium text-[#203E39]">
                  Clinical &amp; Legal Notes
                </Label>
                <Textarea
                  id="doc-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes regarding HIPAA release, special approvals, or consent..."
                  className="rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="doc-legal-hold"
                  checked={editLegalHold}
                  onChange={(e) => setEditLegalHold(e.target.checked)}
                  className="size-4 rounded border-[#DCE5DE] text-[#245C52] focus:ring-[#245C52]"
                />
                <Label htmlFor="doc-legal-hold" className="text-xs font-medium text-[#203E39] cursor-pointer">
                  Place under active Legal Hold (prevents scheduled deletion)
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#DCE5DE]/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingEdit}
                className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F]"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
