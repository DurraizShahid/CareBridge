import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface FacilityCardProps {
  facility: {
    id: string;
    name: string;
    type: string;
    rating: number;
    occupancyPercent: number;
    careLevels: string[];
    city: string;
    state: string;
    hasAvailability: boolean;
  };
}

function getScore(occupancyPercent: number, rating: number): number {
  return Math.round((occupancyPercent / 100) * (rating / 5.0) * 100);
}

function getInterestDots(rating: number): string[] {
  const filledCount = rating >= 4.8 ? 5 : rating >= 4.5 ? 4 : rating >= 4.2 ? 3 : 2;
  const dots: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < filledCount) {
      if (i === 0) dots.push("bg-rose-400");
      else if (i === 1) dots.push("bg-orange-400");
      else if (i === 2) dots.push("bg-amber-400");
      else dots.push("bg-lime-400");
    } else {
      dots.push("bg-gray-200 dark:bg-gray-700");
    }
  }
  return dots;
}

const TOTAL_LOGOS = 30;

const SOURCE_OPTIONS = ["SNC", "Rehab", "Website", "LinkedIn"] as const;

function getSourceLabel(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return SOURCE_OPTIONS[Math.abs(hash) % SOURCE_OPTIONS.length];
}

function getLogoIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % TOTAL_LOGOS) + 1;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const score = getScore(facility.occupancyPercent, facility.rating);
  const sourceLabel = getSourceLabel(facility.name);
  const dots = getInterestDots(facility.rating);
  const logoIndex = getLogoIndex(facility.name);

  return (
    <Link href={`/facilities/${facility.id}`}>
      <div className="group rounded-2xl border border-border/50 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer h-full font-sans">
        {/* Top section: Logo + Score + Arrow */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              <Image
                src={`/logos/Facilities/${logoIndex}.png`}
                alt={facility.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                facility.hasAvailability ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className={`text-[22px] font-semibold tabular-nums leading-none ${score >= 70 ? "text-green-600" : "text-gray-500"}`}>
                {score}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Score</div>
            </div>
            <div className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center group-hover:bg-muted/50 transition-colors">
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Name + Type */}
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug tracking-tight">
            {facility.name}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">{facility.type}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40 mb-4" />

        {/* Source + Interest */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Source
            </div>
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] text-foreground font-medium">
              {sourceLabel}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Interest
            </div>
            <div className="flex gap-1">
              {dots.map((color, i) => (
                <span key={i} className={`w-2.5 h-2.5 rounded-full ${color}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
