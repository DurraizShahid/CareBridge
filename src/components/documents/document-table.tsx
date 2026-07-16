"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { RiFileTextLine } from "@remixicon/react";
import { toast } from "sonner";
import type { Document, DocumentCategory } from "@/types";

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
  "patient-records": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "medical-documentation": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "consent-forms": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "insurance-documents": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "compliance-documents": "bg-red-500/10 text-red-600 dark:text-red-400",
  policies: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  procedures: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "audit-documents": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "employee-training-records": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "business-associate-agreements": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "security-documentation": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "privacy-documentation": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  other: "bg-muted text-muted-foreground",
};

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "text-red-500",
  "image/": "text-purple-500",
  "text/": "text-blue-500",
  "application/msword": "text-blue-600",
  "application/vnd.openxmlformats-officedocument": "text-blue-600",
  "application/vnd.ms-excel": "text-green-600",
  "application/vnd.openxmlformats-officedocument.spreadsheetml": "text-green-600",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getUploaderName(doc: Document): string {
  if (doc.uploadedBy) {
    const name = `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`.trim();
    return name || doc.uploadedBy.email;
  }
  return "Unknown";
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("text/")) return "Text";
  if (mimeType.includes("word")) return "Word";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "Excel";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  return mimeType.split("/").pop()?.toUpperCase() ?? "File";
}

const columnHelper = createColumnHelper<Document>();

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
  canDelete: boolean;
  onRefresh: () => void;
  organizationId: string;
}

function TableSkeleton() {
  return (
    <Card className="overflow-hidden py-0 shadow-sm">
      <div className="flex flex-col gap-1 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DocumentTable({
  documents,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  canDelete,
  onRefresh,
  organizationId,
}: DocumentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === "desc" },
  ]);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Document deleted");
        onRefresh();
      } catch {
        toast.error("Failed to delete document");
      }
    });
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Download failed");
      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    } catch {
      toast.error("Failed to generate download link");
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => {
          const doc = info.row.original;
          const typeLabel = getFileTypeLabel(doc.mimeType);
          return (
            <Link
              href={`/dashboard/documents/${doc.id}`}
              className="flex min-w-0 items-center gap-2 hover:underline"
            >
              <RiFileTextLine className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-foreground">
                {doc.title}
              </span>
              <Badge variant="outline" className="ml-1 shrink-0 text-[10px]">
                {typeLabel}
              </Badge>
            </Link>
          );
        },
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
          const cat = info.getValue();
          return (
            <Badge
              variant="secondary"
              className={cn(CATEGORY_COLORS[cat])}
            >
              {CATEGORY_LABELS[cat]}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("fileSize", {
        header: "File Size",
        cell: (info) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatBytes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "uploadedBy",
        header: "Uploaded By",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {getUploaderName(info.row.original)}
          </span>
        ),
      }),
      columnHelper.accessor("version", {
        header: "Version",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            v{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created At",
        cell: (info) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const doc = info.row.original;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${doc.title}`}
                    />
                  }
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={
                      <Link href={`/dashboard/documents/${doc.id}`} />
                    }
                  >
                    <Eye data-icon="inline-start" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                  >
                    <Download data-icon="inline-start" />
                    Download
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [canDelete, onRefresh, organizationId],
  );

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      if (next.length > 0) {
        onSortChange(next[0].id);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  if (loading) return <TableSkeleton />;

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <RiFileTextLine className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No documents found</EmptyTitle>
              <EmptyDescription>
                No documents match your current filters. Try adjusting your search or
                upload a new document.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0 shadow-sm">
      <ScrollArea className="w-full">
        <Table className="min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      header.id === "actions" && "w-16 text-right",
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 p-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ArrowUp className="h-3 w-3" />,
                          desc: <ArrowDown className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
