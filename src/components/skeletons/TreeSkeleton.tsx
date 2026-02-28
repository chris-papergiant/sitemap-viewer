import Skeleton from '../ui/Skeleton';

const rows = [
  { indent: 0, width: 'w-48' },
  { indent: 1, width: 'w-24' },
  { indent: 1, width: 'w-36' },
  { indent: 1, width: 'w-28' },
  { indent: 2, width: 'w-32' },
  { indent: 2, width: 'w-24' },
  { indent: 1, width: 'w-40' },
  { indent: 1, width: 'w-20' },
  { indent: 1, width: 'w-44' },
  { indent: 1, width: 'w-28' },
];

const TreeSkeleton = () => (
  <div className="p-4 space-y-3">
    {rows.map((row, i) => (
      <div key={i} className="flex items-center gap-3" style={{ paddingLeft: `${row.indent * 24}px` }}>
        <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
        <Skeleton className={`h-4 ${row.width}`} />
      </div>
    ))}
  </div>
);

export default TreeSkeleton;
