"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  X,
  Star,
  MapPin,
  Building2,
  Map as MapIcon,
  List,
  Bed,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Rotate3d,
} from "lucide-react";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { searchFacilitiesAction } from "./actions";
import type { Facility, CareLevel, FacilityType } from "@/types";
import type { MapFacility } from "@/components/map/facility-map";
import { cn } from "@/lib/utils";

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
  recommendationsOnly?: boolean;
  defaultLocation: string;
  role: string;
  userName?: string;
  initialFacilities?: Facility[];
}

export function FacilityNetworkClient({
  defaultLocation,
  role,
  userName,
  initialFacilities = [],
  recommendationsOnly = false,
}: FacilityNetworkClientProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [total, setTotal] = useState(initialFacilities.length);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(initialFacilities.length > 0);
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
  }, [
    location,
    selectedInsurance,
    selectedCareLevels,
    selectedTypes,
    availabilityOnly,
  ]);

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

  const clearFilters = useCallback(() => {
    setSelectedInsurance([]);
    setSelectedCareLevels([]);
    setSelectedTypes([]);
    setAvailabilityOnly(false);
  }, []);

  const availableCount = useMemo(
    () => facilities.filter((f) => f.hasAvailability).length,
    [facilities],
  );

  const averageRating = useMemo(() => {
    if (facilities.length === 0) return "—";
    const sum = facilities.reduce((acc, f) => acc + (f.rating || 0), 0);
    return (sum / facilities.length).toFixed(1);
  }, [facilities]);

  const uniqueCareLevelsCount = useMemo(() => {
    const set = new Set(facilities.flatMap((f) => f.careLevelsOffered));
    return set.size;
  }, [facilities]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title={recommendationsOnly ? "Recommended Facilities" : "Facility Network"}
        description={recommendationsOnly
          ? "Review facilities recommended to your hospital by the AI assistant."
          : "Discover, verify, and inspect regional care facilities, bed availability, and specialty clinical services."}
        userName={userName}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facility Network" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {!recommendationsOnly && <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/facilities" />}
          >
            <Building2 className="size-3.5 text-[#53665E]" />
            All Facilities
          </Button>}
          {recommendationsOnly && <Button render={<Link href="/chat" />}>
            Ask AI Assistant
          </Button>}
          {searched && facilities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap((v) => !v)}
              className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
            >
              {showMap ? (
                <>
                  <List className="size-3.5 text-[#245C52]" />
                  Card View
                </>
              ) : (
                <>
                  <MapIcon className="size-3.5 text-[#245C52]" />
                  Map View
                </>
              )}
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ── 2. Scope & Live Network Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          {recommendationsOnly ? "AI Recommendations" : "Regional Network Directory"}
        </div>
        {location && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
            <MapPin className="size-3 text-[#245C52]" />
            Focused: {location}
          </div>
        )}
        {role === "superadmin" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            System-Wide Cross-Network
          </span>
        )}
      </div>

      {/* ── 3. KPI Stat Cards (when facilities loaded) ── */}
      {facilities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Network Facilities"
            value={total || facilities.length}
            icon={Building2}
            variant="default"
          />
          <StatCard
            title="Available Now"
            value={availableCount}
            icon={Bed}
            variant="health"
            trend={
              availableCount > 0
                ? { value: `${availableCount} accepting`, positive: true }
                : { value: "Full capacity", positive: false }
            }
          />
          <StatCard
            title="Average Rating"
            value={averageRating !== "—" ? `${averageRating} / 5` : "—"}
            icon={Star}
            variant="orange"
          />
          <StatCard
            title="Care Specialties"
            value={`${uniqueCareLevelsCount} levels`}
            icon={CheckCircle2}
            variant="info"
          />
        </div>
      )}

      {/* ── 4. Search and Filter Bar ── */}
      {!recommendationsOnly && (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white rounded-2xl border border-[#DCE5DE] p-3 sm:p-4 shadow-xs">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#53665E]" />
          <Input
            placeholder="Search by city, state, or ZIP code..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-10 pl-10 pr-9 border-[#DCE5DE] bg-transparent text-sm focus-visible:ring-[#245C52]"
          />
          {location && (
            <button
              type="button"
              onClick={() => {
                setLocation("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53665E] hover:text-[#0D1B17]"
              aria-label="Clear location search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-[#DCE5DE] px-3.5 text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC] gap-2"
                />
              }
            >
              <Filter className="size-3.5 text-[#53665E]" />
              Filters
              {hasActiveFilters && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[#245C52] text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-medium text-[#0D1B17]">
                  Filter Care Facilities
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-6 pt-2">
                {/* Immediate Availability toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/70">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="availability"
                      className="text-sm font-medium text-[#0D1B17] cursor-pointer"
                    >
                      Available Beds Only
                    </Label>
                    <p className="text-xs text-[#53665E]">
                      Show facilities currently accepting new patient referrals.
                    </p>
                  </div>
                  <Checkbox
                    id="availability"
                    checked={availabilityOnly}
                    onCheckedChange={(checked) =>
                      setAvailabilityOnly(checked === true)
                    }
                  />
                </div>

                <Separator className="bg-[#DCE5DE]/70" />

                {/* Care Level */}
                <div className="flex flex-col gap-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Care Level Offered
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CARE_LEVEL_OPTIONS.map((cl) => (
                      <label
                        key={cl.value}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EDF2EC]/60 text-xs font-medium text-[#203E39] cursor-pointer transition-colors"
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
                                selectedCareLevels.filter((v) => v !== cl.value),
                              );
                            }
                          }}
                        />
                        {cl.label}
                      </label>
                    ))}
                  </div>
                </div>

                <Separator className="bg-[#DCE5DE]/70" />

                {/* Facility Type */}
                <div className="flex flex-col gap-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Facility Type
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FACILITY_TYPE_OPTIONS.map((ft) => (
                      <label
                        key={ft.value}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EDF2EC]/60 text-xs font-medium text-[#203E39] cursor-pointer transition-colors"
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
                </div>

                <Separator className="bg-[#DCE5DE]/70" />

                {/* Insurance Accepted */}
                <div className="flex flex-col gap-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Insurance Accepted
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_INSURANCE.map((ins) => (
                      <label
                        key={ins}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EDF2EC]/60 text-xs font-medium text-[#203E39] cursor-pointer transition-colors"
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
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#DCE5DE]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-full text-xs text-[#53665E] hover:text-[#0D1B17]"
                >
                  Clear all filters
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-[#245C52] text-xs font-medium text-white hover:bg-[#19473F] px-5"
                  onClick={() => {
                    setFiltersOpen(false);
                    handleSearch();
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="h-10 rounded-xl bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] gap-2 active:scale-[0.98]"
          >
            <Search className="size-3.5" />
            {loading ? "Searching..." : "Search Network"}
          </Button>
        </div>
      </div>

      )}
      {/* ── 5. Active Filters Chips ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {availabilityOnly && (
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#DCE8DA] px-3 py-1 text-xs font-medium text-[#203E39] border border-[#C7D3CA]"
            >
              Available beds only
              <button
                type="button"
                onClick={() => setAvailabilityOnly(false)}
                className="hover:opacity-75"
                aria-label="Remove available beds filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {selectedCareLevels.map((cl) => (
            <Badge
              key={cl}
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#EDF2EC] px-3 py-1 text-xs font-medium text-[#203E39] border border-[#DCE5DE]"
            >
              {CARE_LEVEL_OPTIONS.find((o) => o.value === cl)?.label ?? cl}
              <button
                type="button"
                onClick={() =>
                  setSelectedCareLevels(
                    selectedCareLevels.filter((v) => v !== cl),
                  )
                }
                className="hover:opacity-75"
                aria-label={`Remove filter for ${cl}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {selectedTypes.map((ft) => (
            <Badge
              key={ft}
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#EDF2EC] px-3 py-1 text-xs font-medium text-[#203E39] border border-[#DCE5DE]"
            >
              {FACILITY_TYPE_OPTIONS.find((o) => o.value === ft)?.label ?? ft}
              <button
                type="button"
                onClick={() =>
                  setSelectedTypes(selectedTypes.filter((v) => v !== ft))
                }
                className="hover:opacity-75"
                aria-label={`Remove filter for ${ft}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {selectedInsurance.map((ins) => (
            <Badge
              key={ins}
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#EDF2EC] px-3 py-1 text-xs font-medium text-[#203E39] border border-[#DCE5DE]"
            >
              {ins}
              <button
                type="button"
                onClick={() =>
                  setSelectedInsurance(
                    selectedInsurance.filter((v) => v !== ins),
                  )
                }
                className="hover:opacity-75"
                aria-label={`Remove filter for ${ins}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-[#53665E] hover:text-[#0D1B17] hover:underline px-1"
          >
            Reset all
          </button>
        </div>
      )}

      {/* ── 6. Results Section ── */}
      <div>
        {loading && <FacilityCardsSkeleton count={6} />}

        {recommendationsOnly && facilities.length === 0 && (
          <Empty className="py-16 border border-dashed border-[#DCE5DE] bg-white/60">
            <EmptyHeader>
              <EmptyTitle>No facility recommendations yet</EmptyTitle>
              <EmptyDescription>
                Ask the AI assistant for facility recommendations based on your patient&apos;s care needs and location.
              </EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href="/chat" />}>Ask AI Assistant</Button>
          </Empty>
        )}

        {!recommendationsOnly && !loading && searched && facilities.length === 0 && (
          <Empty className="py-16 border border-dashed border-[#DCE5DE] bg-white/60">
            <EmptyMedia
              variant="icon"
              className="bg-[#EDF2EC] text-[#245C52]"
            >
              <Search className="size-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base text-[#0D1B17]">
                No care facilities match your criteria
              </EmptyTitle>
              <EmptyDescription className="text-xs text-[#53665E]">
                We couldn&apos;t find any partner facilities matching your current location or filter parameters. Try clearing filters or searching a broader city or region.
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full mt-2 text-xs"
                onClick={() => {
                  clearFilters();
                  setLocation("");
                  handleSearch();
                }}
              >
                Reset Search & Filters
              </Button>
            )}
          </Empty>
        )}

        {!recommendationsOnly && !loading && !searched && facilities.length === 0 && (
          <Empty className="py-16 border border-dashed border-[#DCE5DE] bg-white/60">
            <EmptyMedia
              variant="icon"
              className="bg-[#EDF2EC] text-[#245C52]"
            >
              <MapPin className="size-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base text-[#0D1B17]">
                Search care facilities across the network
              </EmptyTitle>
              <EmptyDescription className="text-xs text-[#53665E]">
                Enter a city, state, or ZIP code above to explore verified nursing facilities, rehabilitation centers, and assisted living residences.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              size="sm"
              className="rounded-full mt-2 bg-[#245C52] text-xs font-medium text-white hover:bg-[#19473F]"
              onClick={handleSearch}
            >
              Browse All Facilities
            </Button>
          </Empty>
        )}

        {!loading && facilities.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-[#53665E]">
              <span>
                Showing <strong className="text-[#0D1B17]">{facilities.length}</strong> verified facilit{facilities.length === 1 ? "y" : "ies"}
              </span>
              <span>Sorted by regional proximity & availability</span>
            </div>

            {showMap ? (
              <FacilityMap
                facilities={facilities as MapFacility[]}
                className="h-[520px] w-full rounded-2xl border border-[#DCE5DE] shadow-xs overflow-hidden"
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map((facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  const router = useRouter();
  const typeLabel =
    FACILITY_TYPE_OPTIONS.find((o) => o.value === facility.type)?.label ??
    facility.type;

  return (
    <Link
      href={`/dashboard/facility-network/${facility.id}`}
      className="group block h-full focus:outline-none"
    >
      <Card className="h-full overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white transition-all duration-200 hover:shadow-sm hover:border-[#C7D3CA] flex flex-col">
        {/* Media Thumbnail */}
        <div className="relative h-48 w-full bg-[#FAFBF8] overflow-hidden border-b border-[#DCE5DE]/60">
          {facility.media?.[0] ? (
            <Image
              src={facility.media[0].thumbnailUrl ?? facility.media[0].url}
              alt={facility.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#FAFBF8] text-[#53665E]/30">
              <Building2 className="size-14" />
            </div>
          )}

          {/* Availability Floating Badge */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pointer-events-none">
            {facility.hasAvailability ? (
              <Badge className="bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA] text-xs font-semibold rounded-full px-2.5 py-0.5 shadow-xs">
                <span className="size-1.5 rounded-full bg-[#245C52] mr-1.5 animate-pulse" />
                Available Beds
              </Badge>
            ) : facility.waitlistDays ? (
              <Badge className="bg-white/90 backdrop-blur-xs text-[#53665E] border border-[#DCE5DE] text-xs font-medium rounded-full px-2.5 py-0.5 shadow-xs">
                <Clock className="size-3 mr-1 text-[#C05621]" />
                Waitlist: {facility.waitlistDays}d
              </Badge>
            ) : (
              <Badge className="bg-white/90 backdrop-blur-xs text-[#A33632] border border-[#A33632]/20 text-xs font-medium rounded-full px-2.5 py-0.5 shadow-xs">
                At Capacity
              </Badge>
            )}

            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/facilities/${facility.id}/tour`);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-[#245C52] hover:bg-[#19473F] text-white border border-white/30 text-[11px] font-semibold px-2.5 py-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                title="Open 3D Virtual Tour"
              >
                <Rotate3d className="size-3.5" />
                3D Tour
              </button>
            </div>

          </div>
        </div>

        {/* Card Body */}
        <CardContent className="flex flex-col flex-1 p-5 gap-3 justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg font-medium text-[#0D1B17] group-hover:text-[#245C52] transition-colors leading-snug line-clamp-1">
                {facility.name}
              </h3>
              <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#0D1B17]">
                <Star className="size-3.5 fill-[#C05621] text-[#C05621]" />
                {facility.rating}
              </div>
            </div>

            <div className="space-y-1 text-xs text-[#53665E]">
              <p className="font-medium text-[#203E39] truncate">{typeLabel}</p>
              <p className="flex items-center gap-1">
                <MapPin className="size-3 text-[#245C52] shrink-0" />
                <span className="truncate">
                  {[facility.address?.city, facility.address?.state].filter(Boolean).join(", ")}
                </span>
              </p>
            </div>

            {/* Care Levels Offered Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {facility.careLevelsOffered.slice(0, 3).map((cl) => (
                <Badge
                  key={cl}
                  variant="outline"
                  className="rounded-full bg-[#FAFBF8] border-[#DCE5DE] text-[10px] font-medium text-[#203E39] px-2 py-0.5"
                >
                  {CARE_LEVEL_OPTIONS.find((o) => o.value === cl)?.label ?? cl}
                </Badge>
              ))}
              {facility.careLevelsOffered.length > 3 && (
                <Badge
                  variant="outline"
                  className="rounded-full bg-[#FAFBF8] border-[#DCE5DE] text-[10px] font-medium text-[#53665E] px-2 py-0.5"
                >
                  +{facility.careLevelsOffered.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Footer Details */}
          <div className="flex items-center justify-between pt-3 border-t border-[#DCE5DE]/70 text-xs">
            <span className="text-[#53665E]">
              {facility.currentOccupancy}/{facility.capacity} beds occupied
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/facilities/${facility.id}/tour`);
                }}
                className="font-medium text-[#245C52] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Rotate3d className="size-3" />
                3D Tour
              </button>
              <span className="font-semibold text-[#245C52] group-hover:underline inline-flex items-center gap-1">
                View Profile
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MapSkeleton() {
  return (
    <Skeleton className="h-[520px] w-full rounded-2xl border border-[#DCE5DE]" />
  );
}

export function FacilityCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white"
        >
          <Skeleton className="h-48 w-full rounded-none" />
          <CardContent className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
            <Skeleton className="h-3.5 w-1/3 rounded-md" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
