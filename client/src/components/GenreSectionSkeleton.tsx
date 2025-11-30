import { Skeleton } from "@/components/ui/skeleton";
import BeatCardSkeleton from "./BeatCardSkeleton";

export default function GenreSectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Genre header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Beat cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <BeatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
