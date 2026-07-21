"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  Settings2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface JoinRequest {
  id: string;
  status: string;
  createdAt: Date | string;
  reviewedAt?: Date | string | null;
  notes?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  inviteCode?: {
    code: string;
    role?: string | null;
  } | null;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

const COLUMN_LABELS: Record<string, string> = {
  user: "User",
  email: "Email",
  inviteCode: "Invite Code",
  role: "Role",
  status: "Status",
  createdAt: "Requested",
  reviewedBy: "Reviewed By",
  actions: "Actions",
};

const columnHelper = createColumnHelper<JoinRequest>();

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Not reviewed";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullName(request: JoinRequest): string {
  return `${request.user.firstName} ${request.user.lastName}`.trim() || request.user.email;
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return "Default";
  return role.replace(/_/g, "-");
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "approved":
      return <Badge>Approved</Badge>;
    case "denied":
      return <Badge variant="destructive">Denied</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function JoinRequestsTab({
  joinRequests,
  canCreate,
}: {
  joinRequests: JoinRequest[];
  canCreate: boolean;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleAction = useCallback(
    async (id: string, action: "approve" | "deny") => {
      if (!canCreate) return;

      setProcessingId(id);
      try {
        const res = await fetch(`/api/join-requests/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        if (!res.ok) throw new Error(`Failed to ${action} request`);
        toast.success(`Request ${action}d.`);
        window.location.reload();
      } catch {
        toast.error(`Failed to ${action} request.`);
      } finally {
        setProcessingId(null);
      }
    },
    [canCreate],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all join requests"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select join request for ${fullName(row.original)}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
          />
        ),
        enableHiding: false,
        enableSorting: false,
      }),
      columnHelper.display({
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {fullName(row.original)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.user.id}
            </p>
          </div>
        ),
        sortingFn: "alphanumeric",
      }),
      columnHelper.accessor((row) => row.user.email, {
        id: "email",
        header: "Email",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.inviteCode?.code ?? "", {
        id: "inviteCode",
        header: "Invite Code",
        cell: (info) =>
          info.getValue() ? (
            <span className="font-mono text-sm">{info.getValue()}</span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          ),
      }),
      columnHelper.accessor((row) => roleLabel(row.inviteCode?.role), {
        id: "role",
        header: "Role",
        cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("createdAt", {
        header: "Requested",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        sortingFn: "datetime",
      }),
      columnHelper.display({
        id: "reviewedBy",
        header: "Reviewed By",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.reviewedBy
              ? `${row.original.reviewedBy.firstName} ${row.original.reviewedBy.lastName}`
              : "Not reviewed"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const request = row.original;
          if (request.status !== "pending" || !canCreate) {
            return null;
          }

          const isProcessing = processingId === request.id;

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => handleAction(request.id, "approve")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <CheckCircle2 data-icon="inline-start" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAction(request.id, "deny")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <XCircle data-icon="inline-start" />
                )}
                Deny
              </Button>
            </div>
          );
        },
        enableHiding: false,
        enableSorting: false,
      }),
    ],
    [canCreate, handleAction, processingId],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: joinRequests,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      columnVisibility,
      rowSelection,
    },
    globalFilterFn: (row, _columnId, value) => {
      const request = row.original;
      const query = String(value).toLowerCase();
      return [
        fullName(request),
        request.user.email,
        request.inviteCode?.code ?? "",
        roleLabel(request.inviteCode?.role),
        request.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const firstVisible =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastVisible = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredCount,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card/70 backdrop-blur-xl rounded-xl border-border/60 shadow-sm p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder="Search join requests..."
            className="h-10 pl-9 transition-all duration-200 focus-visible:ring-2"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="h-9" />}>
            <Settings2 data-icon="inline-start" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(checked)}
                >
                  {COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedCount > 0 && (
        <Badge variant="outline" className="w-fit text-muted-foreground">
          {selectedCount} selected
        </Badge>
      )}

        <Card className="overflow-hidden py-0 shadow-sm">
          <CardHeader>
            <CardTitle>Join Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
            <Table className="min-w-[700px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        header.id === "select" && "w-12",
                        header.id === "actions" && "w-48 text-right",
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No join requests found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted/30"
                    >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
              </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {firstVisible} to {lastVisible} of {filteredCount} join requests
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                const pageNum = (() => {
                  const pc = table.getPageCount();
                  const cp = pagination.pageIndex;
                  if (pc <= 5) return i;
                  if (cp <= 2) return i;
                  if (cp >= pc - 3) return pc - 5 + i;
                  return cp - 2 + i;
                })();
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.pageIndex === pageNum ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => table.setPageIndex(pageNum)}
                    aria-label={`Page ${pageNum + 1}`}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
    </div>
  );
}
