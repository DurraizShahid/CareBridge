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
  type SortingState,
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
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  createHospitalAction,
  updateHospitalAction,
  deleteHospitalAction,
  type HospitalActionState,
  type HospitalFormValues,
} from "./actions";
import type { Hospital } from "@/types";

const emptyActionState: HospitalActionState = { status: "idle", message: "" };

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
  const addr = hospital.address as { street: string; city: string; state: string; zipCode: string; county?: string };
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
  };
}

const columnHelper = createColumnHelper<Hospital>();

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Building2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No hospitals found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first hospital to get started.
        </p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add Hospital
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

export function HospitalsTable({
  hospitals,
}: {
  hospitals: Hospital[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="text-sm font-medium text-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("address", {
        id: "city",
        header: "City",
        cell: (info) => {
          const addr = info.getValue() as { city: string; state: string };
          return (
            <span className="text-sm text-muted-foreground">
              {addr.city}, {addr.state}
            </span>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor("npi", {
        header: "NPI",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        ),
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
                    aria-label={`Open actions for ${info.row.original.name}`}
                  />
                }
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem onClick={() => openEditDialog(info.row.original)}>
                  <Pencil data-icon="inline-start" />
                  Edit hospital
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openDeleteDialog(info.row.original)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete hospital
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
      globalFilter,
      pagination,
    },
    globalFilterFn: (row, _columnId, value) => {
      const h = row.original;
      const addr = h.address as { city: string; state: string; zipCode: string };
      const query = String(value).toLowerCase();
      return [
        h.name,
        addr.city,
        addr.state,
        addr.zipCode,
        h.phone,
        h.npi,
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hospitals"
        description="Manage hospital records for your organization."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search hospitals by name, city, phone, or NPI..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="h-9 pl-9"
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus data-icon="inline-start" />
          Add Hospital
        </Button>
      </div>

      {actionState.status === "error" && !dialogOpen && !deleteDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      )}

      {actionState.status === "success" && !dialogOpen && !deleteDialogOpen && (
        <Alert>
          <AlertDescription>
            {actionState.message}
            {actionState.warning && ` ${actionState.warning}`}
          </AlertDescription>
        </Alert>
      )}

      {hospitals.length === 0 ? (
        <EmptyState onAdd={openCreateDialog} />
      ) : (
        <>
          <Card className="overflow-hidden py-0 shadow-sm">
            <ScrollArea className="w-full">
              <Table className="min-w-[700px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No hospitals match your filters.
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
              Showing {firstVisible} to {lastVisible} of {filteredCount} hospitals
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
            <DialogTitle>{editingHospital ? "Edit Hospital" : "Add Hospital"}</DialogTitle>
            <DialogDescription>
              {editingHospital
                ? "Update the hospital record details."
                : "Add a new hospital to your organization."}
            </DialogDescription>
          </DialogHeader>

          {actionState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 min-h-0 -mx-4 px-4">
            <form id="hospital-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    placeholder="General Hospital"
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
                    placeholder="123 Main St"
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
                  />
                </FormField>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Phone">
                    <Input
                      name="phone"
                      value={formValues.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="(503) 555-0100"
                      required
                    />
                  </FormField>
                  <FormField label="NPI (10 digits)">
                    <Input
                      name="npi"
                      value={formValues.npi}
                      onChange={(event) =>
                        updateField("npi", event.target.value)
                      }
                      placeholder="1234567890"
                      required
                    />
                  </FormField>
                </div>

                <Separator className="my-2" />

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Branding</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ImageUploadButton
                      label="Hospital Image"
                      hospitalId={formValues.id}
                      currentUrl={formValues.imageUrl}
                      field="image"
                      onUploaded={(url) => updateField("imageUrl", url)}
                    />
                    <ImageUploadButton
                      label="Hospital Logo"
                      hospitalId={formValues.id}
                      currentUrl={formValues.logoUrl}
                      field="logo"
                      onUploaded={(url) => updateField("logoUrl", url)}
                    />
                  </div>
                  <input type="hidden" name="imageUrl" value={formValues.imageUrl ?? ""} />
                  <input type="hidden" name="logoUrl" value={formValues.logoUrl ?? ""} />
                </div>
              </FieldGroup>
            </form>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" form="hospital-form" disabled={isPending}>
              {isPending
                ? "Saving..."
                : editingHospital
                  ? "Save Changes"
                  : "Create Hospital"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Hospital</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingHospital?.name}</strong>?
              This action cannot be undone. Users assigned to this hospital will retain their hospital ID reference.
            </DialogDescription>
          </DialogHeader>

          {actionState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Hospital"}
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

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const res = await fetch("/api/hospitals/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          hospitalId: hospitalId ?? "temp",
          field,
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");

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
    } catch {
      // swallow error for now
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {preview ? (
        <div className="relative flex items-center gap-2 rounded-lg border p-2">
          <img
            src={preview}
            alt=""
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            Uploaded
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setPreview(undefined);
              onUploaded("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/50">
          <Upload className="h-4 w-4 shrink-0" />
          <span>{uploading ? "Uploading..." : "Upload"}</span>
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
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
