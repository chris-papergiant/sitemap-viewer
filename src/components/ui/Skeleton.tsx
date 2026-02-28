const Skeleton = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-gray-200 rounded-md bg-shimmer-gradient bg-[length:2400px_100%] animate-shimmer ${className}`}
    {...props}
  />
);

export default Skeleton;
