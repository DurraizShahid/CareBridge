"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Building2,
  Bed,
  Star,
  MapPin,
  Rotate3d,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Facility } from "@/types";

const FACILITY_TYPE_LABELS: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "skilled_nursing_facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "rehabilitation_center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "assisted_living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "long_term_care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  "home_health_agency": "Home Health Agency",
  hospice: "Hospice",
};

interface FacilitiesDirectoryClientProps {
  facilities: Facility[];
  canCreate: boolean;
}

export function FacilitiesDirectoryClient({
  facilities,
  canCreate,
}: FacilitiesDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [only3DTour, setOnly3DTour] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "beds" | "rating">("name");

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalFacilities = facilities.length;
    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
    const totalOccupancy = facilities.reduce((sum, f) => sum + (f.currentOccupancy || 0), 0);
    const totalAvailableBeds = Math.max(0, totalCapacity - totalOccupancy);
    const facilitiesWithAvailability = facilities.filter((f) => f.hasAvailability).length;
    const facilitiesWithTour = facilities.filter((f) => !!f.tourConfig).length;
    const avgRating = totalFacilities > 0
      ? (facilities.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFacilities).toFixed(1)
      : "5.0";

    return {
      totalFacilities,
      totalAvailableBeds,
      facilitiesWithAvailability,
      facilitiesWithTour,
      avgRating,
    };
  }, [facilities]);

  // Available unique types from actual data
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    facilities.forEach((f) => {
      if (f.type) types.add(f.type);
    });
    return Array.from(types);
  }, [facilities]);

  // Filtered & Sorted Facilities
  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((facility) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = facility.name?.toLowerCase().includes(q);
          const matchCity = facility.address?.city?.toLowerCase().includes(q);
          const matchState = facility.address?.state?.toLowerCase().includes(q);
          const matchStreet = facility.address?.street?.toLowerCase().includes(q);
          const matchZip = facility.address?.zipCode?.toLowerCase().includes(q);
          const matchType = (FACILITY_TYPE_LABELS[facility.type] || facility.type)?.toLowerCase().includes(q);
          const matchSpecialty = facility.specialties?.some((s) => s.toLowerCase().includes(q));

          if (!matchName && !matchCity && !matchState && !matchStreet && !matchZip && !matchType && !matchSpecialty) {
            return false;
          }
        }

        // Type filter
        if (selectedType !== "all" && facility.type !== selectedType) {
          return false;
        }

        // Availability filter
        if (selectedAvailability === "available" && !facility.hasAvailability) {
          return false;
        }
        if (selectedAvailability === "waitlist" && !facility.waitlistDays) {
          return false;
        }
        if (selectedAvailability === "capacity" && facility.hasAvailability) {
          return false;
        }

        // 3D Tour filter
        if (only3DTour && !facility.tourConfig) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "beds") {
          const bedsA = Math.max(0, a.capacity - a.currentOccupancy);
          const bedsB = Math.max(0, b.capacity - b.currentOccupancy);
          return bedsB - bedsA;
        }
        if (sortBy === "rating") {
          return b.rating - a.rating;
        }
        return 0;
      });
  }, [facilities, searchQuery, selectedType, selectedAvailability, only3DTour, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    selectedAvailability !== "all" ||
    only3DTour;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedAvailability("all");
    setOnly3DTour(false);
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Telemetry / Scope Badges ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified CareBridge Network
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {metrics.facilitiesWithAvailability} Facilities Accepting Patients
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
          <Rotate3d className="size-3.5 text-[#255DCE]" />
          {metrics.facilitiesWithTour} Interactive 3D Tours
        </div>
      </div>

      {/* ── 2. KPI Stat Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Network Facilities"
          value={metrics.totalFacilities}
          icon={Building2}
          variant="default"
          trend={{
            value: `${metrics.facilitiesWithAvailability} active`,
            positive: true,
          }}
        />
        <StatCard
          title="Available Beds"
          value={metrics.totalAvailableBeds}
          icon={Bed}
          variant="health"
          trend={{
            value: `${metrics.totalAvailableBeds} open`,
            positive: metrics.totalAvailableBeds > 0,
          }}
        />
        <StatCard
          title="Average Star Rating"
          value={metrics.avgRating}
          icon={Star}
          variant="orange"
          trend={{
            value: "Network quality",
            positive: true,
            neutral: true,
          }}
        />
        <StatCard
          title="3D Virtual Walkthroughs"
          value={metrics.facilitiesWithTour}
          icon={Rotate3d}
          variant="info"
          trend={{
            value: `${metrics.facilitiesWithTour} ready`,
            positive: true,
          }}
        />
      </div>

      {/* ── 3. Search & Interactive Filter Controls ── */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input with live clear */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#53665E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facilities by name, city, state, care level, or clinical specialty..."
              className="h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] pl-10 pr-9 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10"
              aria-label="Search care facilities"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53665E] hover:text-[#0D1B17] p-1"
                aria-label="Clear search input"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3D Tour Toggle */}
            <button
              type="button"
              onClick={() => setOnly3DTour(!only3DTour)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-all border",
                only3DTour
                  ? "bg-[#255DCE] text-white border-[#255DCE] shadow-xs"
                  : "bg-white text-[#203E39] border-[#DCE5DE] hover:bg-[#FAFBF8]",
              )}
            >
              <Rotate3d className="size-3.5" />
              3D Tours Only
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "beds" | "rating")}
              className="h-11 rounded-xl border border-[#DCE5DE] bg-white px-3.5 text-xs font-semibold text-[#203E39] outline-none transition-colors hover:bg-[#FAFBF8] focus:border-[#245C52]"
              aria-label="Sort facilities by"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="beds">Sort: Most Open Beds</option>
              <option value="rating">Sort: Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#DCE5DE]/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#53665E] mr-1">Facility Type:</span>
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-all border",
                selectedType === "all"
                  ? "bg-[#245C52] text-white border-[#245C52]"
                  : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]",
              )}
            >
              All Types
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-all border",
                  selectedType === type
                    ? "bg-[#245C52] text-white border-[#245C52]"
                    : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]",
                )}
              >
                {FACILITY_TYPE_LABELS[type] ?? type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#53665E] mr-1">Availability:</span>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="rounded-lg border border-[#DCE5DE] bg-[#FAFBF8] px-2.5 py-1 text-xs font-medium text-[#203E39] outline-none focus:border-[#245C52]"
              aria-label="Filter by availability"
            >
              <option value="all">All Bed Statuses</option>
              <option value="available">Immediate Availability</option>
              <option value="waitlist">Waitlist Available</option>
              <option value="capacity">At Capacity</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-[#53665E] hover:text-[#A33632] px-2"
              >
                <X className="size-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Facilities Grid & Results Count ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#0D1B17]">
              Care Facilities
            </h2>
            <p className="text-xs text-[#53665E] mt-0.5">
              Showing {filteredFacilities.length} of {facilities.length} accredited facilities
            </p>
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
              render={<Link href="/facilities/new" />}
            >
              <Plus className="size-3.5" />
              New Facility
            </Button>
          )}
        </div>

        {filteredFacilities.length === 0 ? (
          <Empty className="border border-[#DCE5DE] bg-white rounded-2xl p-12">
            <EmptyMedia variant="icon" className="bg-[#FAFBF8] border border-[#DCE5DE] size-14">
              <Building2 className="size-7 text-[#53665E]" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="font-serif text-xl font-medium text-[#0D1B17]">
                No facilities found
              </EmptyTitle>
              <EmptyDescription className="text-xs sm:text-sm text-[#53665E]">
                {hasActiveFilters
                  ? "None of the facilities match your active search and filter combinations. Try adjusting your search term or clearing filters."
                  : "No facilities are registered under your organization yet."}
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#FAFBF8] mt-2"
              >
                Clear all filters
              </Button>
            ) : canCreate ? (
              <Button
                size="sm"
                className="rounded-full bg-[#245C52] text-xs font-semibold text-white hover:bg-[#19473F] mt-2 gap-1.5"
                render={<Link href="/facilities/new" />}
              >
                <Plus className="size-3.5" />
                Register First Facility
              </Button>
            ) : null}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => {
              const availableBeds = Math.max(0, facility.capacity - facility.currentOccupancy);
              const occupancyPercent = facility.capacity > 0
                ? Math.round((facility.currentOccupancy / facility.capacity) * 100)
                : 0;
              const typeLabel = FACILITY_TYPE_LABELS[facility.type] ?? facility.type;
              const photo =
                facility.media?.find((m) => m.type === "image")?.thumbnailUrl ??
                facility.media?.find((m) => m.type === "image")?.url ??
                facility.media?.[0]?.thumbnailUrl ??
                facility.media?.[0]?.url;

              return (
                <Card
                  key={facility.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white transition-all duration-200 hover:shadow-md hover:border-[#C7D3CA]"
                >
                  {/* Thumbnail / Header Area */}
                  <div className="relative h-48 w-full bg-[#FAFBF8] overflow-hidden border-b border-[#DCE5DE]/60">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={facility.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#FAFBF8] text-[#53665E]/30">
                        <Building2 className="size-16" />
                      </div>
                    )}

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Top Status & 3D Tour Badges */}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pointer-events-none">
                      {/* Availability status badge */}
                      <div>
                        {facility.hasAvailability ? (
                          <Badge className="bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA] text-xs font-semibold rounded-full px-2.5 py-0.5 shadow-xs">
                            <span className="size-1.5 rounded-full bg-[#245C52] mr-1.5 animate-pulse" />
                            {availableBeds > 0 ? `${availableBeds} Open Beds` : "Accepting Patients"}
                          </Badge>
                        ) : facility.waitlistDays ? (
                          <Badge className="bg-white/95 backdrop-blur-xs text-[#53665E] border border-[#DCE5DE] text-xs font-medium rounded-full px-2.5 py-0.5 shadow-xs">
                            <Clock className="size-3 mr-1 text-[#C05621]" />
                            Waitlist: ~{facility.waitlistDays}d
                          </Badge>
                        ) : (
                          <Badge className="bg-white/95 backdrop-blur-xs text-[#A33632] border border-[#A33632]/20 text-xs font-medium rounded-full px-2.5 py-0.5 shadow-xs">
                            At Capacity
                          </Badge>
                        )}
                      </div>

                      {/* 3D Tour Badge */}
                      {facility.tourConfig && (
                        <div className="pointer-events-auto">
                          <Link
                            href={`/facilities/${facility.id}/tour`}
                            className="inline-flex items-center gap-1 rounded-full bg-[#245C52] hover:bg-[#19473F] text-white border border-white/30 text-[11px] font-semibold px-2.5 py-1 shadow-sm transition-transform active:scale-95"
                            title="Open 3D Virtual Tour"
                          >
                            <Rotate3d className="size-3.5" />
                            3D Tour
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Bottom Facility Name & Rating on photo */}
                    <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                      <div className="flex items-center justify-between text-white">
                        <span className="text-xs font-medium drop-shadow-sm text-white/90">
                          {typeLabel}
                        </span>
                        <div className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                          <Star className="size-3 fill-[#F6AD55] text-[#F6AD55]" />
                          {facility.rating}
                          <span className="text-[10px] font-normal text-white/80">
                            ({facility.reviewsCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="flex flex-col flex-1 p-5 gap-3 justify-between">
                    <div className="space-y-2">
                      <Link
                        href={`/facilities/${facility.id}`}
                        className="block focus:outline-none"
                      >
                        <h3 className="font-serif text-lg font-medium text-[#0D1B17] group-hover:text-[#245C52] transition-colors leading-snug line-clamp-1">
                          {facility.name}
                        </h3>
                      </Link>

                      <p className="flex items-center gap-1.5 text-xs text-[#53665E]">
                        <MapPin className="size-3 text-[#245C52] shrink-0" />
                        <span className="truncate">
                          {facility.address.street}, {facility.address.city}, {facility.address.state} {facility.address.zipCode}
                        </span>
                      </p>

                      {/* Care Levels Chips */}
                      {facility.careLevelsOffered.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {facility.careLevelsOffered.slice(0, 3).map((level) => (
                            <Badge
                              key={level}
                              variant="outline"
                              className="rounded-full bg-[#FAFBF8] border-[#DCE5DE] px-2 py-0.5 text-[10px] font-medium text-[#203E39] capitalize"
                            >
                              {level.replace(/-/g, " ").replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {facility.careLevelsOffered.length > 3 && (
                            <span className="text-[10px] text-[#53665E] self-center">
                              +{facility.careLevelsOffered.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Census & Occupancy Metric */}
                    <div className="space-y-1.5 pt-2 border-t border-[#DCE5DE]/70">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#53665E]">Census & Capacity</span>
                        <span className="font-medium text-[#0D1B17]">
                          {facility.currentOccupancy} / {facility.capacity} beds ({occupancyPercent}%)
                        </span>
                      </div>
                      <Progress
                        value={occupancyPercent}
                        className={cn(
                          "h-1.5 bg-[#FAFBF8] border border-[#DCE5DE]/60",
                          occupancyPercent >= 95
                            ? "[&>div]:bg-[#A33632]"
                            : occupancyPercent >= 80
                              ? "[&>div]:bg-[#C05621]"
                              : "[&>div]:bg-[#245C52]",
                        )}
                      />
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE5DE]/70">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-semibold text-[#245C52] hover:text-[#19473F] hover:bg-[#EDF2EC] rounded-lg gap-1"
                        render={<Link href={`/facilities/${facility.id}`} />}
                      >
                        View Profile
                        <ArrowRight className="size-3" />
                      </Button>

                      {facility.tourConfig ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#FAFBF8] rounded-lg gap-1"
                          render={<Link href={`/facilities/${facility.id}/tour`} />}
                        >
                          <Rotate3d className="size-3 text-[#245C52]" />
                          Walkthrough
                        </Button>
                      ) : canCreate ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[11px] text-[#53665E] hover:text-[#203E39]"
                          render={<Link href={`/facilities/${facility.id}/tour/edit`} />}
                        >
                          + Add 3D Tour
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
