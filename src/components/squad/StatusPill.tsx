interface StatusPillProps {
  status: string;
}

const statusMap: Record<string, [string, string]> = {
  accepted: ["bg-squad-green/10 text-squad-green border-squad-green/20", "✓ Joined"],
  declined: ["bg-squad-red/10 text-squad-red border-squad-red/20", "✗ Declined"],
  pending: ["bg-foreground/5 text-squad-text2 border-border", "⏳ Pending"],
  paid: ["bg-squad-green/10 text-squad-green border-squad-green/20", "Paid"],
  upcoming: ["bg-squad-saffron/10 text-squad-saffron border-squad-saffron/20", "Upcoming"],
  completed: ["bg-foreground/5 text-squad-text2 border-border", "Completed"],
};

export default function StatusPill({ status }: StatusPillProps) {
  const [cls, label] = statusMap[status] || ["bg-foreground/5 text-squad-text2 border-border", status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide border ${cls}`}>
      {label}
    </span>
  );
}
