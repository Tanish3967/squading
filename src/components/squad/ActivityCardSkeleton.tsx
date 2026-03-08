export default function ActivityCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4 animate-pulse">
      <div className="shrink-0 w-12 h-14 rounded-xl bg-secondary" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-secondary rounded-lg w-3/4" />
        <div className="h-3 bg-secondary rounded-md w-1/3" />
      </div>
      <div className="h-6 w-16 bg-secondary rounded-full" />
    </div>
  );
}
