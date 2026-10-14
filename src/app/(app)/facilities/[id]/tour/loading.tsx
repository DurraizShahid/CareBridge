import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[min(72vh,680px)] min-h-[420px] rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
