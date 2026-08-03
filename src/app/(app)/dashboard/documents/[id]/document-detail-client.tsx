"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RiArrowLeftLine, RiFileTextLine } from "@remixicon/react";
import type {
  Document,
  DocumentAccessLog,
  DocumentAccessAction,
  DocumentVersion,
} from "@/types";

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
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function DocumentDetailClient({
  documentId,
  document,
  canDelete,
  canAudit,
}: DocumentDetailClientProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [accessLogs, setAccessLogs] = useState<DocumentAccessLog[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [versionSorting, setVersionSorting] = useState<SortingState>([
    { id: "version", desc: true },
  ]);
  const [logSorting, setLogSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
    if (canAudit) fetchAccessLogs();
  }, [canAudit, fetchAccessLogs]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = document?.fileName ?? "document";
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
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

  const versionColumns = useMemo(
    () => [
      versionColumnHelper.accessor("version", {
        header: "Version",
        cell: (info) => <span className="font-medium">v{info.getValue()}</span>,
      }),
      versionColumnHelper.accessor("fileName", {
        header: "File Name",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      versionColumnHelper.accessor("fileSize", {
        header: "Size",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
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
            : "Unknown";
          return <span className="text-sm text-muted-foreground">{name}</span>;
        },
      }),
      versionColumnHelper.accessor("createdAt", {
        header: "Uploaded At",
        cell: (info) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
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
        header: "User",
        cell: (info) => {
          const log = info.row.original;
          const name = log.user
            ? `${log.user.firstName} ${log.user.lastName}`.trim()
            : log.userId;
          return (
            <span className="text-sm text-foreground">{name || "Unknown"}</span>
          );
        },
      }),
      accessLogColumnHelper.accessor("action", {
        header: "Action",
        cell: (info) => {
          const action = info.getValue();
          return (
            <Badge
              variant="secondary"
              className={cn(
                action === "VIEW" && "bg-blue-500/10 text-blue-600",
                action === "DOWNLOAD" && "bg-green-500/10 text-green-600",
                action === "DELETE" && "bg-destructive/10 text-destructive",
                action === "UPLOAD" && "bg-purple-500/10 text-purple-600",
                action === "UPDATE" && "bg-amber-500/10 text-amber-600",
              )}
            >
              {ACTION_LABELS[action] ?? action}
            </Badge>
          );
        },
      }),
      accessLogColumnHelper.accessor("details", {
        header: "Details",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      accessLogColumnHelper.accessor("ipAddress", {
        header: "IP Address",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      accessLogColumnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: (info) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
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
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" onClick={handleDownload} className="gap-2">
          <Download className="size-4" />
          Download
        </Button>
        <Button variant="outline" render={<Link href={`/api/documents/${documentId}/edit`} />} className="gap-2">
          Edit
        </Button>
        {canDelete && (
          <>
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
        )}
      </div>

      {/* Detail tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="versions">
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {versions.length}
              </Badge>
            )}
          </TabsTrigger>
          {canAudit && (
            <TabsTrigger value="access-log">
              Access Log
              {logsTotal > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {logsTotal}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Full Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Document ID
                  </span>
                  <p className="font-mono text-sm">{document.id}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Storage Key
                  </span>
                  <p className="truncate font-mono text-sm">
                    {document.storageKey}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Updated At
                  </span>
                  <p className="text-sm">{formatDate(document.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Archived
                  </span>
                  <p className="text-sm">
                    {document.isArchived ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          {versionsLoading ? (
            <DetailSkeleton />
          ) : versions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <RiFileTextLine className="size-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No version history available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden py-0 shadow-sm">
              <Table>
                <TableHeader>
                  {versionTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {versionTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {canAudit && (
          <TabsContent value="access-log" className="mt-6">
            {logsLoading ? (
              <DetailSkeleton />
            ) : accessLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <RiFileTextLine className="size-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No access log entries found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="overflow-hidden py-0 shadow-sm">
                  <Table>
                    <TableHeader>
                      {logTable.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                          {hg.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {logTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-4 py-3">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
                {logTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {logsPage} of {logTotalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccessLogs(logsPage - 1)}
                        disabled={logsPage <= 1 || logsLoading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccessLogs(logsPage + 1)}
                        disabled={logsPage >= logTotalPages || logsLoading}
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
    </>
  );
}
