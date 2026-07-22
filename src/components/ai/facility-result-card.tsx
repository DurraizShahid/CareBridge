import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiBuilding2Line, RiStarFill } from "@remixicon/react";
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
  "rehabilitation": "Rehab",
  "home-health": "Home Health",
  "hospice": "Hospice",
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
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      aria-label={`View ${facility.name} details`}
    >
      <Card className="group rounded-2xl border-border/50">
        <CardContent>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <RiBuilding2Line className="size-3.5 text-muted-foreground shrink-0" />
                <h4 className="font-medium text-sm leading-tight truncate">
                  {facility.name}
                </h4>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground truncate">
                  {location}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] px-2 py-0 h-5"
            >
              {facilityTypeLabels[facility.type] ?? facility.type}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <RiStarFill className="size-3 text-amber-500" />
              {facility.rating.toFixed(1)}
            </span>
            <Badge
              variant={facility.hasAvailability ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {facility.hasAvailability ? "Available" : "Full"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            {facility.careLevelsOffered.slice(0, 3).map((level) => (
              <Badge
                key={level}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-normal"
              >
                {careLevelLabels[level] ?? level}
              </Badge>
            ))}
            {facility.careLevelsOffered.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                +{facility.careLevelsOffered.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
