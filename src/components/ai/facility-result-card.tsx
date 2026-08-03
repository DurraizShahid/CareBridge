import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RiBuilding2Line, RiStarFill, RiMapPinLine } from "@remixicon/react";
import type { Facility } from "@/types";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health",
  hospice: "Hospice",
};

const careLevelLabels: Record<string, string> = {
  "independent-living": "Independent Living",
  "assisted-living": "Assisted Living",
  "skilled-nursing": "Skilled Nursing",
  "long-term-care": "Long-Term Care",
  rehabilitation: "Rehab",
  "home-health": "Home Health",
  hospice: "Hospice",
  "memory-care": "Memory Care",
};

interface FacilityResultCardProps {
  facility: Facility;
}

export function FacilityResultCard({ facility }: FacilityResultCardProps) {
  const addr = facility.address as { city?: string; state?: string };
  const location = [addr.city, addr.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/dashboard/facility-network/${facility.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      aria-label={`View ${facility.name} details`}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-[#e0ebf4] bg-white transition-all duration-300 hover:shadow-[0_8px_24px_rgba(58,139,191,0.1)] hover:border-[#3a8bbf]/30 hover:-translate-y-0.5"
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#3a8bbf] via-[#58aade] to-[#3a8bbf]/60" />

        <div className="p-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#f0f6fb] shrink-0">
                  <RiBuilding2Line className="size-3.5 text-[#3a8bbf]" />
                </div>
                <h4 className="font-semibold text-[13px] leading-tight truncate text-[#1a2b3d] group-hover:text-[#3a8bbf] transition-colors">
                  {facility.name}
                </h4>
              </div>
              {location && (
                <div className="flex items-center gap-1 ml-9">
                  <RiMapPinLine className="size-3 text-[#9ca5b2] shrink-0" />
                  <p className="text-[11px] text-[#9ca5b2] truncate">
                    {location}
                  </p>
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] px-2 py-0.5 h-5 rounded-lg border-[#e0ebf4] bg-[#f6f9fc] text-[#5a6a7a] font-medium"
            >
              {facilityTypeLabels[facility.type] ?? facility.type}
            </Badge>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e0ebf4]/60 mb-2.5" />

          {/* Rating & Availability */}
          <div className="flex items-center gap-3 text-xs mb-2.5">
            <span className="flex items-center gap-1.5 text-[#5a6a7a]">
              <span className="flex items-center justify-center size-5 rounded-md bg-amber-50">
                <RiStarFill className="size-3 text-amber-500" />
              </span>
              <span className="font-semibold text-[#202936]">{facility.rating.toFixed(1)}</span>
              <span className="text-[#9ca5b2]">rating</span>
            </span>
            <div className="h-3 w-px bg-[#e0ebf4]" />
            <Badge
              variant={facility.hasAvailability ? "default" : "secondary"}
              className={`text-[10px] px-2 py-0.5 h-5 rounded-lg font-medium ${
                facility.hasAvailability
                  ? "bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]"
                  : "bg-[#fce4ec] text-[#c62828] border border-[#f8bbd0]"
              }`}
            >
              {facility.hasAvailability ? "● Available" : "● Full"}
            </Badge>
          </div>

          {/* Care Levels */}
          <div className="flex flex-wrap gap-1">
            {facility.careLevelsOffered.slice(0, 3).map((level) => (
              <Badge
                key={level}
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-5 rounded-lg font-normal border-[#e0ebf4] bg-[#f9fafc] text-[#526273]"
              >
                {careLevelLabels[level] ?? level}
              </Badge>
            ))}
            {facility.careLevelsOffered.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-5 rounded-lg font-normal border-[#e0ebf4] bg-[#f9fafc] text-[#9ca5b2]"
              >
                +{facility.careLevelsOffered.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
