import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 overflow-hidden">
      <Skeleton className="size-16 rounded-full mb-3" />
      <div className="flex flex-col items-center gap-1 mb-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-80" />
      </div>
      <div className="w-full max-w-[680px]">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <div className="w-full max-w-[680px] mt-6">
        <Skeleton className="h-3 w-48 mx-auto mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
