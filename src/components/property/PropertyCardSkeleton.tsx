import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PropertyCardSkeleton = () => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        {/* Image Section Skeleton */}
        <Skeleton className="h-48 w-full rounded-t-lg" />

        {/* Info Section */}
        <div className="p-4 space-y-3">
          {/* Address */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-16 w-full rounded" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Tags */}
          <div className="flex gap-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
