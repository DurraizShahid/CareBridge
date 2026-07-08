import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeaderSkeleton } from "@/components/dashboard-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
