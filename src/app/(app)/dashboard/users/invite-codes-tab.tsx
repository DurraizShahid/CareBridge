"use client";

import { useMemo, useState } from "react";
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
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface InviteCode {
  id: string;
  code: string;
  role?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date | string;
  expiresAt?: Date | string | null;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  "social-worker": "Social Worker",
  "discharge-planner": "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

const COLUMN_LABELS: Record<string, string> = {
  code: "Code",
  role: "Role",
  uses: "Uses",
  createdBy: "Created By",
  createdAt: "Created",
  expiresAt: "Expires",
  status: "Status",
  actions: "Actions",
};

const columnHelper = createColumnHelper<InviteCode>();

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Never";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return "Default";
  const normalized = role.replace(/_/g, "-") as UserRole;
  return ROLE_LABELS[normalized] ?? normalized;
}

function statusLabel(code: InviteCode): "Active" | "Inactive" | "Expired" | "Exhausted" {
  const expiresAt = toDate(code.expiresAt);
  if (!code.isActive) return "Inactive";
  if (expiresAt && expiresAt <= new Date()) return "Expired";
  if (code.maxUses && code.usedCount >= code.maxUses) return "Exhausted";
  return "Active";
}

function StatusBadge({ code }: { code: InviteCode }) {
  const status = statusLabel(code);
  return (
    <Badge
      variant={status === "Active" ? "default" : "secondary"}
      className={cn(
        status === "Expired" || status === "Inactive"
          ? "bg-destructive/10 text-destructive"
          : status === "Exhausted"
            ? "bg-warmth/10 text-warmth"
            : undefined,
      )}
    >
      {status}
    </Badge>
  );
}

export function InviteCodesTab({
  inviteCodes,
  allowedRoles,
  canCreate,
}: {
  inviteCodes: InviteCode[];
  allowedRoles: UserRole[];
  canCreate: boolean;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | "default">(
    "default",
  );
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleCreate = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole === "default" ? null : selectedRole,
          maxUses: maxUses ? Number.parseInt(maxUses, 10) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create invite code");

      toast.success("Invite code created.");
      setIsCreateOpen(false);
      window.location.reload();
    } catch {
      toast.error("Failed to create invite code.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all invite codes"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select invite code ${row.original.code}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
          />
        ),
        enableHiding: false,
        enableSorting: false,
      }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => <Badge variant="outline">{roleLabel(info.getValue())}</Badge>,
        sortingFn: "alphanumeric",
      }),
      columnHelper.display({
        id: "uses",
        header: "Uses",
        cell: ({ row }) => {
          const code = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {code.usedCount}
              {code.maxUses ? ` / ${code.maxUses}` : ""}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdBy.firstName} {row.original.createdBy.lastName}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        sortingFn: "datetime",
      }),
      columnHelper.accessor("expiresAt", {
        header: "Expires",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        sortingFn: "datetime",
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge code={row.original} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => handleCopy(row.original.code)}
            aria-label={`Copy invite code ${row.original.code}`}
          >
            {copiedCode === row.original.code ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        ),
        enableHiding: false,
        enableSorting: false,
      }),
    ],
    [copiedCode],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: inviteCodes,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      columnVisibility,
      rowSelection,
    },
    globalFilterFn: (row, _columnId, value) => {
      const code = row.original;
      const query = String(value).toLowerCase();
      return [
        code.code,
        roleLabel(code.role),
        `${code.createdBy.firstName} ${code.createdBy.lastName}`,
        statusLabel(code),
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
            placeholder="Search invite codes..."
            className="h-9 pl-9"
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
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus data-icon="inline-start" />
              Create Invite Code
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Code</DialogTitle>
                <DialogDescription>
                  Generate a scoped invite for this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) =>
                      setSelectedRole(value as UserRole | "default")
                    }
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      {allowedRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-max-uses">Max Uses</Label>
                  <Input
                    id="invite-max-uses"
                    type="number"
                    min={1}
                    max={10000}
                    value={maxUses}
                    onChange={(event) => setMaxUses(event.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-expires-at">Expires At</Label>
                  <Input
                    id="invite-expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedCount > 0 && (
        <Badge variant="outline" className="w-fit text-muted-foreground">
          {selectedCount} selected
        </Badge>
      )}

      <Card className="overflow-hidden py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Invite Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        header.id === "select" && "w-12",
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No invite codes found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
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
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {firstVisible} to {lastVisible} of {filteredCount} invite codes
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Badge variant="outline" className="min-w-16 justify-center">
            {pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </Badge>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
