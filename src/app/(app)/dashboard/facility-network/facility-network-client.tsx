"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  RiSearchLine,
  RiFilterLine,
  RiCloseLine,
  RiStarFill,
  RiMapPinLine,
  RiBuildingLine,
  RiMapLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { searchFacilitiesAction } from "./actions";
import type { Facility, CareLevel, FacilityType } from "@/types";
import type { MapFacility } from "@/components/map/facility-map";

const FacilityMap = dynamic(
  () => import("@/components/map/facility-map").then((m) => m.FacilityMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

const CARE_LEVEL_OPTIONS: { value: CareLevel; label: string }[] = [
  { value: "independent-living", label: "Independent Living" },
  { value: "assisted-living", label: "Assisted Living" },
  { value: "skilled-nursing", label: "Skilled Nursing" },
  { value: "long-term-care", label: "Long-Term Care" },
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "home-health", label: "Home Health" },
  { value: "hospice", label: "Hospice" },
  { value: "memory-care", label: "Memory Care" },
];

const FACILITY_TYPE_OPTIONS: { value: FacilityType; label: string }[] = [
  { value: "skilled-nursing-facility", label: "Skilled Nursing Facility" },
  { value: "rehabilitation-center", label: "Rehabilitation Center" },
  { value: "assisted-living", label: "Assisted Living" },
  { value: "long-term-care", label: "Long-Term Care" },
  { value: "home-health-agency", label: "Home Health Agency" },
  { value: "hospice", label: "Hospice" },
];

const COMMON_INSURANCE = [
  "Medicare",
  "Medicaid",
  "Blue Cross Blue Shield",
  "Aetna",
  "Cigna",
  "UnitedHealthcare",
  "Humana",
  "Kaiser Permanente",
];

interface FacilityNetworkClientProps {
  defaultLocation: string;
}

export function FacilityNetworkClient({
  defaultLocation,
}: FacilityNetworkClientProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [selectedCareLevels, setSelectedCareLevels] = useState<CareLevel[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<FacilityType[]>([]);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const result = await searchFacilitiesAction({
        location: location || undefined,
        insuranceAccepted:
          selectedInsurance.length > 0 ? selectedInsurance : undefined,
        careLevelsOffered:
          selectedCareLevels.length > 0 ? selectedCareLevels : undefined,
        hasAvailability: availabilityOnly || undefined,
        facilityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      });
      setFacilities(result.facilities);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [location, selectedInsurance, selectedCareLevels, selectedTypes, availabilityOnly]);

  const hasActiveFilters =
    selectedInsurance.length > 0 ||
    selectedCareLevels.length > 0 ||
    selectedTypes.length > 0 ||
    availabilityOnly;

  const activeFilterCount =
    selectedInsurance.length +
    selectedCareLevels.length +
    selectedTypes.length +
    (availabilityOnly ? 1 : 0);

  const clearFilters = () => {
    setSelectedInsurance([]);
    setSelectedCareLevels([]);
    setSelectedTypes([]);
    setAvailabilityOnly(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Facility Network
        </h1>
        <p className="text-muted-foreground">
          Discover and explore facilities in your area
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end bg-card/70 backdrop-blur-xl rounded-xl border-border/60 shadow-sm p-4">
        <div className="relative flex-1">
          <RiMapPinLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="City, state, or ZIP code"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <RiFilterLine className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="availability">Available beds only</Label>
                  <Checkbox
                    id="availability"
                    checked={availabilityOnly}
                    onCheckedChange={(checked) =>
                      setAvailabilityOnly(checked === true)
                    }
                  />
                </div>
                <Separator />

                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">Care Level</Label>
                  {CARE_LEVEL_OPTIONS.map((cl) => (
                    <label
                      key={cl.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedCareLevels.includes(cl.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCareLevels([
                              ...selectedCareLevels,
                              cl.value,
                            ]);
                          } else {
                            setSelectedCareLevels(
                              selectedCareLevels.filter(
                                (v) => v !== cl.value,
                              ),
                            );
                          }
                        }}
                      />
                      {cl.label}
                    </label>
                  ))}
                </div>
                <Separator />

                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">
                    Facility Type
                  </Label>
                  {FACILITY_TYPE_OPTIONS.map((ft) => (
                    <label
                      key={ft.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedTypes.includes(ft.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes([...selectedTypes, ft.value]);
                          } else {
                            setSelectedTypes(
                              selectedTypes.filter((v) => v !== ft.value),
                            );
                          }
                        }}
                      />
                      {ft.label}
                    </label>
                  ))}
                </div>
                <Separator />

                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">
                    Insurance Accepted
                  </Label>
                  {COMMON_INSURANCE.map((ins) => (
                    <label
                      key={ins}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedInsurance.includes(ins)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInsurance([
                              ...selectedInsurance,
                              ins,
                            ]);
                          } else {
                            setSelectedInsurance(
                              selectedInsurance.filter((v) => v !== ins),
                            );
                          }
                        }}
                      />
                      {ins}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setFiltersOpen(false);
                    handleSearch();
                  }}
                >
                  Apply filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            <RiSearchLine className="size-4" />
            Search
          </Button>
          {searched && facilities.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowMap((v) => !v)}
              className="gap-2"
            >
              <RiMapLine className="size-4" />
              {showMap ? "List" : "Map"}
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedCareLevels.map((cl) => (
            <Badge key={cl} variant="secondary" className="gap-1">
              {CARE_LEVEL_OPTIONS.find((o) => o.value === cl)?.label ?? cl}
              <button
                onClick={() =>
                  setSelectedCareLevels(
                    selectedCareLevels.filter((v) => v !== cl),
                  )
                }
              >
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedTypes.map((ft) => (
            <Badge key={ft} variant="secondary" className="gap-1">
              {FACILITY_TYPE_OPTIONS.find((o) => o.value === ft)?.label ??
                ft}
              <button
                onClick={() =>
                  setSelectedTypes(selectedTypes.filter((v) => v !== ft))
                }
              >
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedInsurance.map((ins) => (
            <Badge key={ins} variant="secondary" className="gap-1">
              {ins}
              <button
                onClick={() =>
                  setSelectedInsurance(
                    selectedInsurance.filter((v) => v !== ins),
                  )
                }
              >
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          ))}
          {availabilityOnly && (
            <Badge variant="secondary" className="gap-1">
              Available beds only
              <button onClick={() => setAvailabilityOnly(false)}>
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      <div>
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiMapPinLine className="size-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">
              Find facilities near you
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a location and apply filters to discover available
              facilities
            </p>
          </div>
        )}

        {loading && <FacilityCardsSkeleton count={6} />}

        {searched && !loading && facilities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiSearchLine className="size-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">
              No facilities found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your location or filters
            </p>
          </div>
        )}

        {searched && !loading && facilities.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {total} facility{total !== 1 ? "ies" : "y"} found
            </p>
            {showMap ? (
              <FacilityMap
                facilities={facilities as MapFacility[]}
                className="h-[500px] w-full rounded-lg border"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map((facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link href={`/dashboard/facility-network/${facility.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative h-48 bg-muted">
          {facility.media?.[0] ? (
            <Image
              src={
                facility.media[0].thumbnailUrl ?? facility.media[0].url
              }
              alt={facility.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <RiBuildingLine className="size-16" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
            {facility.hasAvailability ? (
              <Badge className="bg-health text-white">Available</Badge>
            ) : facility.waitlistDays ? (
              <Badge variant="secondary">
                Waitlist: {facility.waitlistDays}d
              </Badge>
            ) : null}
          </div>
        </div>
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{facility.name}</h3>
            <div className="flex shrink-0 items-center gap-0.5">
              <span className="text-sm font-medium">
                {facility.rating}
              </span>
              <RiStarFill className="size-3.5 text-amber-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {
              FACILITY_TYPE_OPTIONS.find(
                (o) => o.value === facility.type,
              )?.label
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {facility.address.city}, {facility.address.state}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {facility.careLevelsOffered.slice(0, 3).map((cl) => (
              <Badge key={cl} variant="outline" className="text-[10px]">
                {CARE_LEVEL_OPTIONS.find((o) => o.value === cl)?.label ??
                  cl}
              </Badge>
            ))}
            {facility.careLevelsOffered.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{facility.careLevelsOffered.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MapSkeleton() {
  return <Skeleton className="h-[500px] w-full rounded-lg" />;
}

export function FacilityCardsSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full rounded-none" />
          <CardContent className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="mt-1 flex gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
