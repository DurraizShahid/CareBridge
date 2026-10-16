import Link from "next/link";
import { RiStarFill, RiMapPinLine, RiBox3Line, RiArrowRightUpLine, RiCheckLine } from "@remixicon/react";
import type { Facility } from "@/types";

const careLevelLabels: Record<string, string> = {
  "independent-living": "Independent living",
  "assisted-living": "Assisted living",
  "skilled-nursing": "Skilled nursing",
  "long-term-care": "Long-term care",
  rehabilitation: "Rehab",
  "home-health": "Home health",
  hospice: "Hospice",
  "memory-care": "Memory care",
};

export type ChatFacility = Facility & { hasTour?: boolean };

interface FacilityResultCardProps {
  facility: ChatFacility;
  /** Position in the ranked list; 0 is the best match. */
  rank?: number;
  bestMatch?: boolean;
  selected?: boolean;
  onSelect?: (facility: Facility) => void;
}

export function FacilityResultCard({ facility, rank = 0, bestMatch, selected, onSelect }: FacilityResultCardProps) {
  const addr = facility.address as { city?: string; state?: string };
  const location = [addr.city, addr.state].filter(Boolean).join(", ");
  const openBeds = Math.max(0, facility.capacity - facility.currentOccupancy);
  const top = bestMatch ?? rank === 0;

  return (
    <article
      aria-label={`${facility.name}${top ? ", best match" : ""}`}
      className={`rounded-[20px] p-4 transition-colors duration-200 sm:p-5 ${
        selected ? "bg-[var(--chat-user)]" : "bg-[var(--chat-raised)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {top && (
            <p className="mb-1 text-[13px] font-semibold text-[var(--chat-accent)]">Best match</p>
          )}
          <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[var(--chat-ink)] [overflow-wrap:anywhere]">
            {facility.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--chat-dim)]">
            {location && (
              <span className="inline-flex items-center gap-1">
                <RiMapPinLine className="size-3.5" aria-hidden="true" />
                {location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <RiStarFill className="size-3.5 text-[#B7791F]" aria-hidden="true" />
              {facility.rating.toFixed(1)}
              <span className="sr-only">out of 5</span>
            </span>
          </p>
        </div>
        <p
          className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold tabular-nums ${
            openBeds > 0
              ? "bg-[var(--chat-ok-bg)] text-[var(--chat-ok)]"
              : "bg-[var(--chat-warn-bg)] text-[var(--chat-warn)]"
          }`}
        >
          {openBeds > 0 ? `${openBeds} ${openBeds === 1 ? "bed" : "beds"} open` : "Full"}
        </p>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-[var(--chat-ink)]">
        {facility.careLevelsOffered.map((l) => careLevelLabels[l] ?? l).join(", ")}
        {facility.insuranceAccepted.length > 0 && (
          <span className="text-[var(--chat-dim)]">
            {" "}
            · Takes {facility.insuranceAccepted.slice(0, 3).join(", ")}
            {facility.insuranceAccepted.length > 3 && ` and ${facility.insuranceAccepted.length - 3} more`}
          </span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(facility)}
            disabled={selected}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--chat-accent)] px-4 text-[14px] font-semibold text-white transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chat-accent)] disabled:cursor-default disabled:opacity-100 dark:text-[#0B1730]"
          >
            {selected ? (
              <>
                <RiCheckLine className="size-4" aria-hidden="true" />
                Selected
              </>
            ) : (
              "Select facility"
            )}
          </button>
        )}
        {facility.hasTour && (
          <Link
            href={`/facilities/${facility.id}/tour`}
            target="_blank"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--chat-quiet)] px-4 text-[14px] font-semibold text-[var(--chat-ink)] transition-colors duration-150 hover:bg-[var(--chat-user)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chat-accent)]"
          >
            <RiBox3Line className="size-4" aria-hidden="true" />
            3D tour
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        )}
        <Link
          href={`/dashboard/facility-network/${facility.id}`}
          target="_blank"
          className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-[var(--chat-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chat-accent)]"
        >
          Facility details
          <RiArrowRightUpLine className="size-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>
    </article>
  );
}
