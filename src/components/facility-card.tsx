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
    source: string;
  };
}

function getInterestDots(rating: number): { color: string; filled: boolean }[] {
  const filledCount = rating >= 4.8 ? 5 : rating >= 4.5 ? 4 : rating >= 4.2 ? 3 : 2;
  const colors = ["bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-lime-400", "bg-green-400"];
  return Array.from({ length: 5 }, (_, i) => ({
    color: colors[i],
    filled: i < filledCount,
  }));
}

const TOTAL_LOGOS = 30;

function getLogoIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % TOTAL_LOGOS) + 1;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const dots = getInterestDots(facility.rating);
  const logoIndex = getLogoIndex(facility.name);
  const clipId = `card-notch-${facility.id}`;

  return (
    <Link href={`/facilities/${facility.id}`}>
      <div className="relative group cursor-pointer">
        {/* SVG Clip Path — concave notch at top-right for arrow button */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              {/*
                Path (0-1 coords):
                - Top-left corner radius: 0.07
                - Concave notch arc radius: 0.16 (top-right, curves inward)
                - Bottom-right / bottom-left corner radius: 0.07
              */}
              <path d="
                M 0.07 0
                H 0.81
                A 0.16 0.16 0 0 0 1 0.19
                V 0.93
                A 0.07 0.07 0 0 1 0.93 1
                H 0.07
                A 0.07 0.07 0 0 1 0 0.93
                V 0.07
                A 0.07 0.07 0 0 1 0.07 0
                Z
              " />
            </clipPath>
          </defs>
        </svg>

        {/* Card body — clipped with the notch */}
        <div
          className="relative bg-white dark:bg-zinc-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ clipPath: `url(#${clipId})` }}
        >
          <div className="p-5 pb-6">
            {/* Avatar */}
            <div className="mb-5">
              <div className="relative inline-block">
                <div className="size-14 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-600">
                  <Image
                    src={`/logos/Facilities/${logoIndex}.png`}
                    alt={facility.name}
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white dark:border-zinc-800 ${
                    facility.hasAvailability ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>
            </div>

            {/* Name + Type */}
            <div className="mb-5">
              <h3 className="text-xl font-bold text-foreground dark:text-white leading-tight tracking-tight">
                {facility.name}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">
                {facility.type}
              </p>
            </div>

            {/* Source + Interest dots */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Source
                </div>
                <div className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-700 px-3 py-1.5 text-xs text-foreground dark:text-zinc-200 font-medium">
                  {facility.source}
                </div>
              </div>
              <div className="flex gap-1.5">
                {dots.map((dot, i) => (
                  <span
                    key={i}
                    className={`size-3 rounded-full ${
                      dot.filled ? dot.color : "bg-zinc-200 dark:bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Arrow button — sits in the concave notch */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-700/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-600 transition-all duration-200 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-600 group-hover:border-zinc-300 dark:group-hover:border-zinc-500">
            <ArrowUpRight className="size-4 text-zinc-600 dark:text-zinc-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
