import { Loader2 } from "lucide-react";

interface Props {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export default function PullIndicator({ pullDistance, refreshing, threshold = 80 }: Props) {
  if (pullDistance <= 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const ready = progress >= 1;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: pullDistance > 0 ? pullDistance : refreshing ? 48 : 0 }}
    >
      <div className={`transition-transform duration-200 ${ready || refreshing ? "text-primary" : "text-muted-foreground"}`}>
        {refreshing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <div
            className="transition-transform duration-150"
            style={{ transform: `rotate(${progress * 180}deg)`, opacity: progress }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
