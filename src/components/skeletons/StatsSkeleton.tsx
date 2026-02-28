import Skeleton from '../ui/Skeleton';

const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
);

export default StatsSkeleton;
