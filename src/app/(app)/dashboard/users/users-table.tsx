"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
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
  Database,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import {
  createUserAction,
  setUserAccessAction,
  syncUserProfileAction,
  updateUserAction,
} from "./actions";
import type { UserRole } from "@/types";
import type { DashboardUser, UserActionState, UserFormValues } from "./types";

const ROLE_LABELS: Record<UserRole, string> = {
  "social-worker": "Social Worker",
  "discharge-planner": "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

const ROLE_COLORS: Record<UserRole, string> = {
  "social-worker":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "discharge-planner":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  administrator:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "facility-coordinator":
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  superadmin:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  customer: "bg-muted text-muted-foreground",
};

const emptyActionState: UserActionState = { status: "idle", message: "" };

function getEmptyFormValues(allowedRoles: UserRole[]): UserFormValues {
  return {
    email: "",
    firstName: "",
    lastName: "",
    role: allowedRoles[0] ?? "customer",
    title: "",
    department: "",
    hospitalId: "",
    phone: "",
  };
}

const columnHelper = createColumnHelper<DashboardUser>();

function formatDate(isoString: string | null): string {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(user: DashboardUser): string {
  const first = user.firstName.trim()[0] ?? "";
  const last = user.lastName.trim()[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || user.email.trim()[0]?.toUpperCase() || "U";
}

function getFullName(user: DashboardUser): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.email || user.id;
}

function getFormValues(user: DashboardUser): UserFormValues {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    title: user.title,
    department: user.department,
    hospitalId: user.hospitalId,
    phone: user.phone,
  };
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No Clerk users found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          New accounts will appear here after they are created in Clerk.
        </p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export function UsersTable({
  totalCount,
  users,
  allowedRoles,
  canManage,
}: {
  totalCount: number;
  users: DashboardUser[];
  allowedRoles: UserRole[];
  canManage: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
  const [formValues, setFormValues] =
    useState<UserFormValues>(getEmptyFormValues(allowedRoles));
  const [actionState, setActionState] =
    useState<UserActionState>(emptyActionState);
  const [isPending, startTransition] = useTransition();

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormValues(getEmptyFormValues(allowedRoles));
    setActionState(emptyActionState);
  }, [allowedRoles]);

  const openCreateDialog = useCallback(() => {
    setEditingUser(null);
    setFormValues(getEmptyFormValues(allowedRoles));
    setActionState(emptyActionState);
    setDialogOpen(true);
  }, [allowedRoles]);

  const openEditDialog = useCallback((user: DashboardUser) => {
    setEditingUser(user);
    setFormValues(getFormValues(user));
    setActionState(emptyActionState);
    setDialogOpen(true);
  }, []);

  function updateField<K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = editingUser
        ? await updateUserAction(formData)
        : await createUserAction(formData);
      setActionState(nextState);
      if (nextState.status === "success") closeDialog();
    });
  }

  function runRowAction(action: () => Promise<UserActionState>) {
    setActionState(emptyActionState);
    startTransition(async () => {
      const nextState = await action();
      setActionState(nextState);
    });
  }

  const columns = useMemo(
    () => {
      const cols = [
      columnHelper.accessor("firstName", {
        id: "name",
        header: "User",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={getFullName(user)} />
                <AvatarFallback>{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {getFullName(user)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => {
          const role = info.getValue();
          return (
            <Badge className={cn(ROLE_COLORS[role])}>
              {ROLE_LABELS[role]}
            </Badge>
          );
        },
        filterFn: "equalsString",
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "Not set"}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "Not set"}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("hospitalId", {
        header: "Hospital/Facility",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "Not set"}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "Not set"}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("accountStatus", {
        header: "Account",
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge
              variant={status === "active" ? "outline" : "destructive"}
              className="capitalize"
            >
              {status}
            </Badge>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("databaseStatus", {
        header: "Profile",
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                status === "missing" && "border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300",
              )}
            >
              {status === "linked" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Database className="h-3 w-3" />
              )}
              {status === "linked" ? "DB linked" : "DB missing"}
            </Badge>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("lastSignInAt", {
        header: "Last Sign-In",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        sortingFn: "datetime",
        enableColumnFilter: false,
      }),
      columnHelper.accessor("updatedAt", {
        header: "Profile Updated",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        sortingFn: "datetime",
        enableColumnFilter: false,
      }),
      ...(canManage
        ? [
            columnHelper.display({
              id: "actions",
              header: "",
              cell: (info) => {
                const user = info.row.original;
                const isDisabled = user.accountStatus === "banned";

                return (
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Open actions for ${getFullName(user)}`}
                          />
                        }
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            runRowAction(() => syncUserProfileAction(user.id))
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                          Sync profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={isDisabled ? "default" : "destructive"}
                          onClick={() =>
                            runRowAction(() =>
                              setUserAccessAction(
                                user.id,
                                isDisabled ? "unban" : "ban",
                              ),
                            )
                          }
                        >
                          {isDisabled ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                          {isDisabled ? "Enable sign-in" : "Disable sign-in"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              },
            }),
          ]
        : []),
      ];
      return cols;
    },
    [openEditDialog, canManage],
  );

  // The dashboard is required to use TanStack Table for user grids.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    globalFilterFn: (row, _columnId, value) => {
      const user = row.original;
      const query = String(value).toLowerCase();
      return [
        getFullName(user),
        user.email,
        user.title,
        user.department,
        user.hospitalId,
        user.phone,
        ROLE_LABELS[user.role],
        user.accountStatus,
        user.databaseStatus,
        user.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const roleFilter =
    (table.getColumn("role")?.getFilterValue() as string | undefined) ?? "all";
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex;
  const firstVisible =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastVisible = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredCount,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage Clerk identities with their Railway database profiles."
      >
        <Badge variant="outline" className="gap-2 text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-health" />
          Clerk + Railway
        </Badge>
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name, email, role, department, or phone..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            table
              .getColumn("role")
              ?.setFilterValue(value === "all" ? undefined : value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="h-9 w-full md:w-56">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {allowedRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {actionState.status === "error" && !dialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      )}

      {actionState.status === "success" && !dialogOpen && (
        <Alert>
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      )}

      {users.length === 0 ? (
        <EmptyState onAdd={openCreateDialog} />
      ) : (
        <>
          <Card className="py-0">
            <ScrollArea className="w-full">
              <Table className="min-w-[1180px]">
                <TableHeader className="bg-muted/50">
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
                            className="h-auto p-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-transparent hover:text-foreground"
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
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
            </Card>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {firstVisible} to {lastVisible} of {filteredCount} loaded
              users
              {totalCount > users.length
                ? ` (${users.length} of ${totalCount} loaded from Clerk)`
                : ""}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pageCount <= 5) {
                    pageNum = i;
                  } else if (currentPage <= 2) {
                    pageNum = i;
                  } else if (currentPage >= pageCount - 3) {
                    pageNum = pageCount - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon-xs"
                      onClick={() => table.setPageIndex(pageNum)}
                      aria-label={`Page ${pageNum + 1}`}
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
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update the Clerk identity and its linked Railway profile."
                : "Create a Clerk user and the matching Railway profile row."}
            </DialogDescription>
          </DialogHeader>

          {actionState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 min-h-0 -mx-4 px-4">
            <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              {editingUser && (
                <Input type="hidden" name="id" value={formValues.id ?? ""} />
              )}

              <FieldGroup className="gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="First Name">
                    <Input
                      name="firstName"
                      value={formValues.firstName}
                      onChange={(event) =>
                        updateField("firstName", event.target.value)
                      }
                      placeholder="Jane"
                      required
                    />
                  </FormField>
                  <FormField label="Last Name">
                    <Input
                      name="lastName"
                      value={formValues.lastName}
                      onChange={(event) =>
                        updateField("lastName", event.target.value)
                      }
                      placeholder="Doe"
                      required
                    />
                  </FormField>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Email">
                    <Input
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="jane.doe@hospital.org"
                      required
                    />
                  </FormField>
                  <FormField label="Role">
                    <Input type="hidden" name="role" value={formValues.role} />
                    <Select
                      value={formValues.role}
                      onValueChange={(value) =>
                        updateField("role", value as UserRole)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Title">
                    <Input
                      name="title"
                      value={formValues.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      placeholder="Senior Social Worker"
                    />
                  </FormField>
                  <FormField label="Department">
                    <Input
                      name="department"
                      value={formValues.department}
                      onChange={(event) =>
                        updateField("department", event.target.value)
                      }
                      placeholder="Discharge Planning"
                    />
                  </FormField>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Hospital or Facility ID">
                    <Input
                      name="hospitalId"
                      value={formValues.hospitalId}
                      onChange={(event) =>
                        updateField("hospitalId", event.target.value)
                      }
                      placeholder="hosp-001"
                    />
                  </FormField>
                  <FormField label="Phone">
                    <Input
                      name="phone"
                      value={formValues.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="(555) 234-5678"
                    />
                  </FormField>
                </div>
              </FieldGroup>
            </form>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" disabled={isPending}>
              {isPending
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
