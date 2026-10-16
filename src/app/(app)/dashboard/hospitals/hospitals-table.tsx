"use client";

/* eslint-disable @next/next/no-img-element */

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
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Phone,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenuCheckboxItem,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  createHospitalAction,
  updateHospitalAction,
  deleteHospitalAction,
  type HospitalActionState,
  type HospitalFormValues,
} from "./actions";
import { cn } from "@/lib/utils";
import type { Hospital } from "@/types";

const emptyActionState: HospitalActionState = { status: "idle", message: "" };

const COLUMN_LABELS: Record<string, string> = {
  name: "Hospital Name",
  city: "City & Region",
  phone: "Contact Phone",
  npi: "NPI Identifier",
};

function getEmptyFormValues(): HospitalFormValues {
  return {
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    phone: "",
    npi: "",
  };
}

function getFormValues(hospital: Hospital): HospitalFormValues {
  const addr = hospital.address as {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };
  return {
    id: hospital.id,
    name: hospital.name,
    street: addr.street,
    city: addr.city,
    state: addr.state,
    zipCode: addr.zipCode,
    county: addr.county,
    phone: hospital.phone,
    npi: hospital.npi,
    imageUrl: hospital.imageUrl,
    logoUrl: hospital.logoUrl,
  };
}

const columnHelper = createColumnHelper<Hospital>();

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
      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
        {label}
      </FieldLabel>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

interface HospitalsTableProps {
  hospitals: Hospital[];
  userName?: string;
  role?: string;
}

export function HospitalsTable({
  hospitals,
  userName,
  role,
}: HospitalsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [deletingHospital, setDeletingHospital] = useState<Hospital | null>(null);
  const [formValues, setFormValues] =
    useState<HospitalFormValues>(getEmptyFormValues());
  const [actionState, setActionState] =
    useState<HospitalActionState>(emptyActionState);
  const [isPending, startTransition] = useTransition();

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingHospital(null);
    setFormValues(getEmptyFormValues());
    setActionState(emptyActionState);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingHospital(null);
    setFormValues(getEmptyFormValues());
    setActionState(emptyActionState);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormValues(getFormValues(hospital));
    setActionState(emptyActionState);
    setDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((hospital: Hospital) => {
    setDeletingHospital(hospital);
    setActionState(emptyActionState);
    setDeleteDialogOpen(true);
  }, []);

  function updateField<K extends keyof HospitalFormValues>(
    key: K,
    value: HospitalFormValues[K],
  ) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = editingHospital
        ? await updateHospitalAction(formData)
        : await createHospitalAction(formData);
      setActionState(nextState);
      if (nextState.status === "success") closeDialog();
    });
  }

  function handleDelete() {
    if (!deletingHospital) return;
    startTransition(async () => {
      const nextState = await deleteHospitalAction(deletingHospital.id);
      setActionState(nextState);
      if (nextState.status === "success") {
        setDeleteDialogOpen(false);
        setDeletingHospital(null);
      }
    });
  }

  // ── Compute Key Metric KPIs ──
  const totalHospitals = hospitals.length;
  const uniqueCities = useMemo(() => {
    const cities = hospitals
      .map((h) => (h.address as { city?: string })?.city)
      .filter(Boolean);
    return new Set(cities).size;
  }, [hospitals]);

  const uniqueStates = useMemo(() => {
    const states = hospitals
      .map((h) => (h.address as { state?: string })?.state)
      .filter(Boolean);
    return new Set(states).size;
  }, [hospitals]);

  const verifiedNpis = useMemo(() => {
    return hospitals.filter((h) => h.npi && h.npi.replace(/\D/g, "").length === 10).length;
  }, [hospitals]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all hospitals"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
          />
        ),
        enableHiding: false,
        enableSorting: false,
      }),
      columnHelper.accessor("name", {
        header: "Hospital Facility",
        cell: (info) => {
          const h = info.row.original;
          const addr = h.address as { street?: string; city?: string };
          return (
            <div className="flex items-center gap-3 py-1">
              {h.logoUrl ? (
                <img
                  src={h.logoUrl}
                  alt=""
                  className="size-9 rounded-full object-cover border border-[#DCE5DE]"
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]">
                  <Building2 className="size-4" />
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <span className="font-serif text-sm font-medium text-[#0D1B17] hover:text-[#245C52] transition-colors truncate block">
                  {info.getValue()}
                </span>
                {addr?.street && (
                  <span className="text-xs text-[#53665E] truncate block">
                    {addr.street}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("address", {
        id: "city",
        header: "Location",
        cell: (info) => {
          const addr = info.getValue() as {
            city: string;
            state: string;
            county?: string;
          };
          return (
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-medium text-[#203E39] block">
                {addr.city}, {addr.state}
              </span>
              {addr.county && (
                <span className="inline-block text-[10px] text-[#53665E] bg-[#FAFBF8] border border-[#DCE5DE] rounded px-1.5 py-0.2">
                  {addr.county} Co.
                </span>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <a
            href={`tel:${info.getValue()}`}
            className="text-xs sm:text-sm text-[#53665E] hover:text-[#0D1B17] hover:underline flex items-center gap-1.5"
          >
            <Phone className="size-3 text-[#245C52] shrink-0" />
            {info.getValue()}
          </a>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("npi", {
        header: "NPI Registry",
        cell: (info) => {
          const npi = info.getValue();
          const isValid = npi && npi.replace(/\D/g, "").length === 10;
          return (
            <div className="inline-flex items-center gap-1.5">
              <span className="font-mono text-xs font-medium text-[#203E39] bg-[#FAFBF8] border border-[#DCE5DE] px-2 py-0.5 rounded-md">
                {npi}
              </span>
              {isValid && (
                <CheckCircle2 className="size-3.5 text-[#245C52]" />
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full hover:bg-[#EDF2EC] text-[#53665E]"
                    aria-label={`Open actions for ${info.row.original.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-[#53665E]">
                    Hospital Management
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => openEditDialog(info.row.original)}
                  className="text-xs cursor-pointer"
                >
                  <Pencil className="size-3.5 mr-2 text-[#53665E]" />
                  Edit hospital details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openDeleteDialog(info.row.original)}
                  className="text-xs cursor-pointer text-[#A33632]"
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete hospital record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [openEditDialog, openDeleteDialog],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: hospitals,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
    },
    globalFilterFn: (row, _columnId, value) => {
      const h = row.original;
      const addr = h.address as {
        city: string;
        state: string;
        zipCode: string;
        county?: string;
      };
      const query = String(value).toLowerCase();
      return [
        h.name,
        addr.city,
        addr.state,
        addr.zipCode,
        addr.county,
        h.phone,
        h.npi,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex;
  const firstVisible =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastVisible = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredCount,
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Partner Hospitals"
        description="Maintain hospital registry credentials, National Provider Identifiers (NPI), operational contacts, and facility branding."
        userName={userName}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Partner Hospitals" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5"
          >
            <Plus className="size-3.5" />
            Add Hospital
          </Button>
        </div>
      </PageHeader>

      {/* ── 2. Scope & Status Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Health System Registry Scope
        </div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <FileCheck className="size-3 text-[#245C52]" />
          CMS NPI Integration
        </div>
        {role === "superadmin" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            System-Wide Cross-Organization
          </span>
        )}
      </div>

      {/* ── 3. KPI Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Partner Hospitals"
          value={totalHospitals}
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Regional Cities"
          value={`${uniqueCities} Cities`}
          icon={MapPin}
          variant="info"
        />
        <StatCard
          title="Coverage States"
          value={`${uniqueStates} State${uniqueStates !== 1 ? "s" : ""}`}
          icon={ShieldCheck}
          variant="health"
        />
        <StatCard
          title="Verified NPIs"
          value={`${verifiedNpis} / ${totalHospitals}`}
          icon={CheckCircle2}
          variant="orange"
          trend={
            verifiedNpis === totalHospitals && totalHospitals > 0
              ? { value: "100% verified", positive: true }
              : { value: `${totalHospitals - verifiedNpis} unverified`, positive: false }
          }
        />
      </div>

      {/* ── 4. Search, Column Toggles, and Controls Bar ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white rounded-2xl border border-[#DCE5DE] p-3 md:p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#53665E]" />
          <Input
            type="text"
            placeholder="Search hospitals by name, city, phone, county, or NPI..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="h-10 pl-10 pr-9 border-[#DCE5DE] bg-transparent text-sm focus-visible:ring-[#245C52]"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53665E] hover:text-[#0D1B17]"
              aria-label="Clear search query"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-[#DCE5DE] px-3.5 text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC] gap-2"
                />
              }
            >
              <Settings2 className="size-3.5 text-[#53665E]" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuLabel className="text-xs text-[#53665E]">
                Toggle visible columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) =>
                      column.toggleVisibility(checked)
                    }
                    className="text-xs cursor-pointer"
                  >
                    {COLUMN_LABELS[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={openCreateDialog}
            className="h-10 rounded-xl bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] gap-1.5 active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            Add Hospital
          </Button>
        </div>
      </div>

      {/* Alert states */}
      {actionState.status === "error" && !dialogOpen && !deleteDialogOpen && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      )}

      {actionState.status === "success" && !dialogOpen && !deleteDialogOpen && (
        <Alert className="rounded-xl border-[#C7D3CA] bg-[#EDF2EC] text-[#203E39]">
          <AlertDescription>
            {actionState.message}
            {actionState.warning && ` ${actionState.warning}`}
          </AlertDescription>
        </Alert>
      )}

      {selectedCount > 0 && (
        <Badge
          variant="outline"
          className="w-fit rounded-full bg-[#EDF2EC] border-[#DCE5DE] text-xs font-medium text-[#203E39]"
        >
          {selectedCount} hospital{selectedCount !== 1 ? "s" : ""} selected
        </Badge>
      )}

      {/* ── 5. Main Content: Table or Empty State ── */}
      {hospitals.length === 0 ? (
        <Empty className="py-16 border border-dashed border-[#DCE5DE] bg-white/60">
          <EmptyMedia
            variant="icon"
            className="bg-[#EDF2EC] text-[#245C52]"
          >
            <Building2 className="size-5" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-base text-[#0D1B17]">
              No hospital records registered
            </EmptyTitle>
            <EmptyDescription className="text-xs text-[#53665E]">
              Register partner hospitals to configure electronic discharge transfer pathways, NPI verification, and regional routing.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            onClick={openCreateDialog}
            className="mt-2 rounded-full bg-[#245C52] text-xs font-medium text-white hover:bg-[#19473F] gap-1.5"
          >
            <Plus className="size-3.5" />
            Add First Hospital
          </Button>
        </Empty>
      ) : (
        <>
          <Card className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white shadow-xs py-0">
            <ScrollArea className="w-full">
              <Table className="min-w-[750px]">
                <TableHeader className="bg-[#FAFBF8] border-b border-[#DCE5DE]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#53665E]",
                            header.id === "select" && "w-12",
                            header.id === "actions" && "w-16 text-right",
                          )}
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto gap-1 p-0 text-xs font-semibold uppercase tracking-wider text-[#53665E] hover:bg-transparent hover:text-[#0D1B17]"
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
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={table.getVisibleLeafColumns().length}
                        className="px-4 py-14 text-center"
                      >
                        <p className="text-sm font-medium text-[#0D1B17]">
                          No hospitals match your search
                        </p>
                        <p className="text-xs text-[#53665E] mt-1">
                          Try adjusting your search terms or clearing the filter.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        className="transition-colors hover:bg-[#FAFBF8] data-[state=selected]:bg-[#EDF2EC]/50 border-b border-[#DCE5DE]/60"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-3.5">
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

          {/* Pagination Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <p className="text-xs text-[#53665E]">
              Showing <strong className="text-[#0D1B17]">{firstVisible}</strong> to{" "}
              <strong className="text-[#0D1B17]">{lastVisible}</strong> of{" "}
              <strong className="text-[#0D1B17]">{filteredCount}</strong> hospitals
            </p>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
                className="rounded-lg border-[#DCE5DE] text-[#53665E] hover:bg-[#EDF2EC]"
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
                className="rounded-lg border-[#DCE5DE] text-[#53665E] hover:bg-[#EDF2EC]"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <div className="flex items-center gap-1 px-1">
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
                      className={cn(
                        "rounded-lg text-xs font-semibold",
                        currentPage === pageNum
                          ? "bg-[#245C52] text-white hover:bg-[#19473F]"
                          : "border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC]",
                      )}
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
                className="rounded-lg border-[#DCE5DE] text-[#53665E] hover:bg-[#EDF2EC]"
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
                className="rounded-lg border-[#DCE5DE] text-[#53665E] hover:bg-[#EDF2EC]"
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── 6. Create / Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-[#0D1B17]">
              {editingHospital ? "Edit Hospital Record" : "Register Partner Hospital"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53665E]">
              {editingHospital
                ? "Update clinical location, NPI credentials, and organizational contact data."
                : "Add a new hospital facility to your healthcare provider directory."}
            </DialogDescription>
          </DialogHeader>

          {actionState.status === "error" && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 min-h-0 -mx-4 px-4">
            <form
              id="hospital-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 py-2"
            >
              {editingHospital && (
                <Input type="hidden" name="id" value={formValues.id ?? ""} />
              )}

              <FieldGroup className="gap-4">
                <FormField label="Hospital Name">
                  <Input
                    name="name"
                    value={formValues.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="e.g. Memorial General Hospital"
                    className="border-[#DCE5DE] text-sm"
                    required
                  />
                </FormField>

                <FormField label="Street Address">
                  <Input
                    name="street"
                    value={formValues.street}
                    onChange={(event) =>
                      updateField("street", event.target.value)
                    }
                    placeholder="123 Medical Center Drive"
                    className="border-[#DCE5DE] text-sm"
                    required
                  />
                </FormField>

                <div className="grid gap-3 md:grid-cols-3">
                  <FormField label="City">
                    <Input
                      name="city"
                      value={formValues.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      placeholder="Portland"
                      className="border-[#DCE5DE] text-sm"
                      required
                    />
                  </FormField>
                  <FormField label="State">
                    <Input
                      name="state"
                      value={formValues.state}
                      onChange={(event) =>
                        updateField("state", event.target.value)
                      }
                      placeholder="OR"
                      className="border-[#DCE5DE] text-sm"
                      required
                    />
                  </FormField>
                  <FormField label="ZIP Code">
                    <Input
                      name="zipCode"
                      value={formValues.zipCode}
                      onChange={(event) =>
                        updateField("zipCode", event.target.value)
                      }
                      placeholder="97201"
                      className="border-[#DCE5DE] text-sm"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="County (optional)">
                  <Input
                    name="county"
                    value={formValues.county ?? ""}
                    onChange={(event) =>
                      updateField("county", event.target.value)
                    }
                    placeholder="Multnomah"
                    className="border-[#DCE5DE] text-sm"
                  />
                </FormField>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Contact Phone">
                    <Input
                      name="phone"
                      value={formValues.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="(503) 555-0100"
                      className="border-[#DCE5DE] text-sm"
                      required
                    />
                  </FormField>
                  <FormField label="National Provider Identifier (NPI)">
                    <Input
                      name="npi"
                      value={formValues.npi}
                      onChange={(event) =>
                        updateField("npi", event.target.value)
                      }
                      placeholder="10-digit NPI number"
                      className="border-[#DCE5DE] text-sm font-mono"
                      required
                    />
                  </FormField>
                </div>

                <input
                  type="hidden"
                  name="imageUrl"
                  value={formValues.imageUrl ?? ""}
                />
                <input
                  type="hidden"
                  name="logoUrl"
                  value={formValues.logoUrl ?? ""}
                />

                {editingHospital && (
                  <>
                    <Separator className="my-2 bg-[#DCE5DE]" />

                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                        Facility Branding & Assets
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <ImageUploadButton
                          label="Facility Exterior Image"
                          hospitalId={formValues.id}
                          currentUrl={formValues.imageUrl}
                          field="image"
                          onUploaded={(url) => updateField("imageUrl", url)}
                        />
                        <ImageUploadButton
                          label="Hospital Crest / Logo"
                          hospitalId={formValues.id}
                          currentUrl={formValues.logoUrl}
                          field="logo"
                          onUploaded={(url) => updateField("logoUrl", url)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </FieldGroup>
            </form>
          </ScrollArea>

          <DialogFooter className="pt-2 border-t border-[#DCE5DE]">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="hospital-form"
              disabled={isPending}
              className="rounded-full bg-[#245C52] text-xs font-semibold text-white hover:bg-[#19473F] px-5"
            >
              {isPending
                ? "Saving..."
                : editingHospital
                  ? "Save Changes"
                  : "Register Hospital"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 7. Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium text-[#A33632]">
              Delete Hospital Record
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53665E] pt-1">
              Are you sure you want to remove{" "}
              <strong className="text-[#0D1B17]">{deletingHospital?.name}</strong>{" "}
              from the active directory? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          {actionState.status === "error" && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-full text-xs"
            >
              Keep Hospital
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-full text-xs font-semibold px-5"
            >
              {isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageUploadButton({
  label,
  hospitalId,
  currentUrl,
  field,
  onUploaded,
}: {
  label: string;
  hospitalId?: string;
  currentUrl?: string;
  field: "image" | "logo";
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    if (!hospitalId) {
      setError("Save the hospital before uploading branding images.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/hospitals/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          hospitalId,
          field,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to get upload URL");
      }

      const { url, fields, key } = await res.json();
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, v as string));
      form.append("Content-Type", file.type);
      form.append("file", file);

      const uploadRes = await fetch(url, { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const bucketUrl = `${url.split("?")[0]}/${encodeURIComponent(key.split("/").pop()!)}`;
      setPreview(bucketUrl);
      onUploaded(bucketUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-[#53665E]">{label}</p>
      {error && (
        <Alert variant="destructive" className="rounded-xl py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {preview ? (
        <div className="relative flex items-center gap-2 rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-2">
          <img
            src={preview}
            alt=""
            className="size-12 shrink-0 rounded-lg object-cover border border-[#DCE5DE]"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-[#53665E]">
            Asset uploaded
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setPreview(undefined);
              onUploaded("");
            }}
            className="rounded-full hover:bg-[#EDF2EC]"
            aria-label="Remove uploaded image"
          >
            <X className="size-3.5 text-[#53665E]" />
          </Button>
        </div>
      ) : (
        <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#DCE5DE] bg-[#FAFBF8] p-3 text-xs font-medium text-[#53665E] transition-colors hover:border-[#245C52] hover:bg-[#EDF2EC]/40">
          <Upload className="size-4 shrink-0 text-[#245C52]" />
          <span>{uploading ? "Uploading asset..." : "Upload image"}</span>
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
