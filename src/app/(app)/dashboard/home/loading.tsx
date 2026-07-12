import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="w-full max-w-2xl">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-8 w-44 rounded-full" />
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-full" />
      </div>
    </div>
  );
}
