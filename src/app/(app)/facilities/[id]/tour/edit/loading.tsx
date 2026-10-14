import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-80 rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
