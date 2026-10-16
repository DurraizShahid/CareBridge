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
  FileText,
  UploadCloud,
  RotateCcw,
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
  "employee-training-records": "Training Records",
  "business-associate-agreements": "BAA Agreements",
  "security-documentation": "Security Docs",
  "privacy-documentation": "Privacy Docs",
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
  return "System Service";
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
  onUploadClick?: () => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

function TableSkeleton() {
  return (
    <Card className="rounded-2xl border border-[#DCE5DE] bg-white overflow-hidden py-0 shadow-sm">
      <div className="flex flex-col gap-1 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 flex-[2] bg-[#EDF2EC]" />
            <Skeleton className="h-5 w-28 rounded-full bg-[#EDF2EC]" />
            <Skeleton className="h-4 w-16 bg-[#EDF2EC]" />
            <Skeleton className="h-4 w-28 bg-[#EDF2EC]" />
            <Skeleton className="h-4 w-8 bg-[#EDF2EC]" />
            <Skeleton className="h-4 w-24 bg-[#EDF2EC]" />
            <Skeleton className="size-8 rounded-full bg-[#EDF2EC]" />
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
  onUploadClick,
  onClearFilters,
  hasActiveFilters,
}: DocumentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === "desc" },
  ]);
  const [, startTransition] = useTransition();

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This action is recorded in the immutable audit log.`)) return;
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
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download document");
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Document Name",
        cell: (info) => {
          const doc = info.row.original;
          const typeLabel = getFileTypeLabel(doc.mimeType);
          return (
            <Link
              href={`/dashboard/documents/${doc.id}`}
              className="flex min-w-0 items-center gap-2.5 group"
            >
              <div className="size-7 rounded-lg bg-[#EDF2EC] text-[#245C52] flex items-center justify-center shrink-0 border border-[#DCE5DE]">
                <RiFileTextLine className="size-4" />
              </div>
              <span className="truncate text-sm font-semibold text-[#0D1B17] group-hover:text-[#245C52] transition-colors">
                {doc.title}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]">
                {typeLabel}
              </span>
            </Link>
          );
        },
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
          const cat = info.getValue();
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground",
              )}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          );
        },
      }),
      columnHelper.accessor("fileSize", {
        header: "File Size",
        cell: (info) => (
          <span className="text-xs text-[#53665E] tabular-nums whitespace-nowrap">
            {formatBytes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "uploadedBy",
        header: "Uploaded By",
        cell: (info) => (
          <span className="text-xs text-[#53665E] truncate max-w-[140px] block">
            {getUploaderName(info.row.original)}
          </span>
        ),
      }),
      columnHelper.accessor("version", {
        header: "Version",
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
            v{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (
          <span className="text-xs text-[#53665E] tabular-nums whitespace-nowrap">
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
                      size="icon-xs"
                      className="size-8 rounded-full text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC]"
                      aria-label={`Actions for ${doc.title}`}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#DCE5DE] bg-white p-1 shadow-md">
                  <DropdownMenuLabel className="text-[11px] font-semibold text-[#53665E] uppercase px-2 py-1">
                    Document Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#DCE5DE]/60" />
                  <DropdownMenuItem
                    className="text-xs font-medium text-[#0D1B17] hover:bg-[#EDF2EC] rounded-lg cursor-pointer"
                    render={
                      <Link href={`/dashboard/documents/${doc.id}`} />
                    }
                  >
                    <Eye className="size-3.5 mr-2 text-[#245C52]" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs font-medium text-[#0D1B17] hover:bg-[#EDF2EC] rounded-lg cursor-pointer"
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                  >
                    <Download className="size-3.5 mr-2 text-[#245C52]" />
                    Download File
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator className="bg-[#DCE5DE]/60" />
                      <DropdownMenuItem
                        variant="destructive"
                        className="text-xs font-medium text-[#A33632] hover:bg-[#FAEEEB] rounded-lg cursor-pointer"
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Record
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
      const next = typeof updater === "function" ? updater(sorting) : updater;
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
      <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-8 shadow-sm">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <FileText className="size-8 text-[#53665E]/50" />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-medium text-[#0D1B17]">
              {hasActiveFilters ? "No matching records found" : "No documents in vault"}
            </EmptyTitle>
            <EmptyDescription className="text-xs text-[#53665E] max-w-sm">
              {hasActiveFilters
                ? "No documents matched your active search term or filter parameters. Try clearing filters to see all records."
                : "Upload medical transfer packets, face sheets, consent documents, or compliance records to this secure vault."}
            </EmptyDescription>
          </EmptyHeader>
          <div className="mt-4 flex justify-center gap-3">
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="rounded-full border-[#DCE5DE] bg-white px-4 text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC]"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Reset Filters
              </Button>
            )}
            {onUploadClick && (
              <Button
                size="sm"
                onClick={onUploadClick}
                className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F]"
              >
                <UploadCloud className="size-3.5 mr-1.5" />
                Upload Document
              </Button>
            )}
          </div>
        </Empty>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-[#DCE5DE] bg-white overflow-hidden py-0 shadow-sm">
      <ScrollArea className="w-full">
        <Table className="min-w-[840px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-[#DCE5DE] bg-[#FAFBF8]/80 hover:bg-[#FAFBF8]/80">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#53665E]",
                      header.id === "actions" && "w-16 text-right",
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 p-0 text-[11px] font-semibold uppercase tracking-wider text-[#53665E] hover:bg-transparent hover:text-[#0D1B17]"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ArrowUp className="size-3 text-[#245C52]" />,
                          desc: <ArrowDown className="size-3 text-[#245C52]" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ArrowUpDown className="size-3 opacity-40" />
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
          <TableBody className="divide-y divide-[#DCE5DE]/60">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="transition-colors hover:bg-[#FAFBF8] border-b border-[#DCE5DE]/40">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3.5">
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
