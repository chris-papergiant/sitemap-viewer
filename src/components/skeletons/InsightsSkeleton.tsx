import Skeleton from '../ui/Skeleton';

const InsightsSkeleton = () => (
  <div className="space-y-6 mt-6">
    {/* Health score card skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>

    {/* Content distribution skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-3">
        {[80, 60, 40, 20, 10].map((width, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 flex-1 rounded-full" style={{ maxWidth: `${width}%` }} />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default InsightsSkeleton;
