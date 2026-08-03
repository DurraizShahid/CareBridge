import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[38px] w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-[46px] w-72" style={{ borderRadius: "4px" }} />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ActivePlacementsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivitySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="relative flex flex-col">
      <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
          <Skeleton className="relative z-10 h-[30px] w-[30px] shrink-0 rounded-full ring-4 ring-background" />
          <div className="min-w-0 flex-1 flex flex-col gap-1 pt-0.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyCaseloadSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PendingApprovalsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-4 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReferralRequestsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyFacilitySkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="my-4 h-px w-full" />
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-12" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-16" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function FacilityNetworkSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

const placementWidths = ["55%", "70%", "85%", "60%", "90%", "75%"];

export function PlacementsByMonthSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        {placementWidths.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-8 text-right" />
            <div className="flex-1">
              <Skeleton className="h-2.5 w-full rounded-full" style={{ maxWidth: w }} />
            </div>
            <Skeleton className="h-3 w-6 text-right" />
          </div>
        ))}
      </div>
    </div>
  );
}

const roleWidths = ["45%", "80%", "60%", "35%", "50%"];

export function UsersByRoleSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        {roleWidths.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-2.5 w-full rounded-full" style={{ maxWidth: w }} />
            </div>
            <Skeleton className="h-3 w-6 text-right" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentUsersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlatformHealthSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </div>
      <Skeleton className="my-4 h-px w-full" />
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-14" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-16" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function FacilityDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function FacilitiesPageSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-0">
              <div className="flex items-start justify-between border-b border-border px-5 py-4">
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
              <div className="flex flex-col gap-3 px-5 pb-4">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-28" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function PlacementsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-px w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-px w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-px w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-px w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PlacementDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PatientDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}

export function HospitalsTableSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Card className="overflow-hidden py-0 shadow-sm">
        <div className="flex flex-col gap-1 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function HospitalsPageSkeleton() {
  return <HospitalsTableSkeleton />;
}

export function UsersTableSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Card className="overflow-hidden py-0 shadow-sm">
        <div className="flex flex-col gap-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-4 rounded-[4px]" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-56" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function InviteCodesTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Card className="overflow-hidden py-0 shadow-sm">
        <CardContent className="flex flex-col gap-1 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-4 rounded-[4px]" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function JoinRequestsTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Card className="overflow-hidden py-0 shadow-sm">
        <CardContent className="flex flex-col gap-1 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-4 rounded-[4px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <UsersTableSkeleton />
    </div>
  );
}

export function FacilityNetworkSearchSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Skeleton className="h-10 flex-1" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function FacilityNetworkGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full rounded-none" />
          <CardContent className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="mt-1 flex gap-1">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FacilityNetworkMapSkeleton() {
  return <Skeleton className="h-[500px] w-full rounded-lg" />;
}

export function FacilityNetworkPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <FacilityNetworkSearchSkeleton />
      <FacilityNetworkGridSkeleton />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Top nav pills */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[38px] w-24 rounded-full" />
        ))}
      </div>

      {/* Welcome hero */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[52px] w-80" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Pipeline + controls */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full sm:max-w-md rounded-full" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[48px] w-[48px] rounded-full" />
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <StatsGridSkeleton />

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-5 md:row-span-2">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-7">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-8 w-24 mb-3" />
              <Skeleton className="h-10 w-full rounded-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-4">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-48 w-full rounded-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-20 mb-4" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-4">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-4">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="h-36 w-full rounded-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-4">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AIHomePageSkeleton() {
  return (
    <div
      className="-mx-6 flex overflow-hidden"
      style={{ height: 'calc(100dvh - 3.5rem - 6rem)', marginTop: '-2rem' }}
    >
      {/* Sidebar skeleton */}
      <div className="w-64 shrink-0 border-r border-border/30 overflow-hidden bg-sidebar">
        <div className="w-64 h-full">
          <div className="p-3">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="flex-1 px-2 pb-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-0.5">
                <Skeleton className="mx-2 h-3.5 w-20" />
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex shrink-0 items-center border-b border-border/30 bg-background px-6 py-3.5 z-10">
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-24">
            <div className="flex flex-col items-center gap-3 mb-12 max-w-xl text-center">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="w-full max-w-[720px]">
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            <div className="w-full max-w-[720px] mt-6 flex flex-wrap gap-2 justify-center">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-56 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HospitalDockSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-border bg-background/95 px-2">
      <div className="flex w-full items-center max-w-lg mx-auto gap-4 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatientMatchingPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <Card>
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DocumentVaultStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-7 w-16 align-middle" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DocumentTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full rounded-lg" />
      <Card className="overflow-hidden py-0 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 border-b border-border px-4 py-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-4", i === 0 ? "w-8" : i === 1 ? "w-36 flex-1" : i === 2 ? "w-24" : i === 3 ? "w-20" : i === 4 ? "w-28" : i === 5 ? "w-20" : "w-8")} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
              <Skeleton className="h-4 w-4 rounded-[4px]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function DocumentDetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2 border-b border-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-t-lg rounded-b-none" />
            ))}
          </div>
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DocumentVaultPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <DocumentVaultStatsSkeleton />
      <DocumentTableSkeleton />
    </div>
  );
}

export const DocumentsPageSkeleton = DocumentVaultPageSkeleton;

