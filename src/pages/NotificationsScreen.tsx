import { Activity, User, MOCK_USERS } from "@/lib/mock-data";

interface Props {
  currentUser: User;
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
}

export default function NotificationsScreen({ currentUser, activities, onActivityClick }: Props) {
  const notifications = [
    ...activities
      .filter(a => a.invitees.some(i => i.userId === currentUser.id && i.status === "pending"))
      .map(a => ({
        type: "invite",
        activity: a,
        message: `${MOCK_USERS.find(u => u.id === a.creatorId)?.name.split(" ")[0]} invited you to "${a.title}"`,
        time: "2h ago",
        icon: "🎯",
      })),
    ...activities
      .filter(a => a.invitees.some(i => i.userId === currentUser.id && i.attended))
      .map(a => ({
        type: "refund",
        activity: a,
        message: `Your ₹${a.deposit} deposit for "${a.title}" is being refunded!`,
        time: "1d ago",
        icon: "💸",
      })),
    {
      type: "system",
      activity: null as Activity | null,
      message: "Welcome to Squad! Create your first activity.",
      time: "3d ago",
      icon: "👋",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="pt-[52px] px-6 pb-5">
        <p className="font-display text-[22px] font-extrabold">Notifications</p>
      </div>
      <div className="px-6 flex flex-col gap-2.5">
        {notifications.map((n, i) => (
          <div
            key={i}
            onClick={() => n.activity && onActivityClick(n.activity)}
            className="flex gap-3.5 p-4 bg-card border border-border rounded-2xl items-start cursor-pointer transition-colors hover:border-foreground/10"
          >
            <div className="w-10 h-10 rounded-xl bg-squad-bg3 flex items-center justify-center text-xl shrink-0">{n.icon}</div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">{n.message}</p>
              <p className="text-xs text-squad-text3 mt-0.5">{n.time}</p>
            </div>
            {n.type === "invite" && <div className="w-2 h-2 rounded-full bg-squad-saffron shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
