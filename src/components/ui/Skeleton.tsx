import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg bg-white/[0.05]', className)} />;
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-white/20 border-t-white', className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl2 border border-white/[0.07] bg-white/[0.02]">
      <Skeleton className="aspect-[3/4] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
