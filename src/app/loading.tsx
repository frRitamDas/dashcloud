import { Skeleton } from '@/components/ui/Skeleton';
import { LogoMark } from '@/components/ui/Logo';

export default function Loading() {
  return (
    <div className="section py-12">
      <div className="flex items-center gap-3">
        <LogoMark size={28} className="animate-pulse-soft" />
        <Skeleton className="h-5 w-40 rounded-md" />
      </div>
      <Skeleton className="mt-8 h-[240px] rounded-3xl sm:h-[320px]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[188px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
