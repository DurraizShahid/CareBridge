import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-16 align-middle" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ActivePlacementsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecentActivitySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} size="sm" className="border-transparent bg-transparent shadow-none">
          <CardContent className="flex items-start gap-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MyCaseloadSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PendingApprovalsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReferralRequestsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MyFacilitySkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="my-4 h-px w-full" />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-12" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacilityNetworkSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} size="sm">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const placementWidths = ["55%", "70%", "85%", "60%", "90%", "75%"];

export function PlacementsByMonthSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        {placementWidths.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-8 text-right" />
            <div className="flex-1">
              <Skeleton className="h-2 w-full rounded-full" style={{ maxWidth: w }} />
            </div>
            <Skeleton className="h-3 w-6 text-right" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const roleWidths = ["45%", "80%", "60%", "35%", "50%"];

export function UsersByRoleSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        {roleWidths.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-2 w-full rounded-full" style={{ maxWidth: w }} />
            </div>
            <Skeleton className="h-3 w-6 text-right" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentUsersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} size="sm">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PlatformHealthSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
        <Skeleton className="my-4 h-px w-full" />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-14" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <Skeleton className="mb-4 h-5 w-36" />
          <ActivePlacementsSkeleton count={3} />
        </section>
        <section>
          <Skeleton className="mb-4 h-5 w-32" />
          <RecentActivitySkeleton count={4} />
        </section>
      </div>
    </div>
  );
}

export function StaffDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <MyCaseloadSkeleton count={3} />
        </section>
        <section>
          <Skeleton className="mb-4 h-5 w-36" />
          <PendingApprovalsSkeleton count={2} />
          <Skeleton className="mb-4 mt-8 h-5 w-32" />
          <RecentActivitySkeleton count={4} />
        </section>
      </div>
    </div>
  );
}

export function FacilityDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <ReferralRequestsSkeleton count={3} />
        </section>
        <section className="space-y-6">
          <div>
            <Skeleton className="mb-4 h-5 w-24" />
            <MyFacilitySkeleton />
          </div>
          <div>
            <Skeleton className="mb-4 h-5 w-36" />
            <FacilityNetworkSkeleton count={3} />
          </div>
        </section>
      </div>
    </div>
  );
}

export function FacilityDetailSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
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
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-20" />
          </div>
          <PlacementsByMonthSkeleton />
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <UsersByRoleSkeleton />
        </section>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <RecentUsersSkeleton count={3} />
        </section>
        <section className="space-y-6">
          <div>
            <Skeleton className="mb-4 h-5 w-48" />
            <RecentActivitySkeleton count={4} />
          </div>
          <div>
            <Skeleton className="mb-4 h-5 w-32" />
            <PlatformHealthSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}
