import { Home, Bell, Activity, User, Plus } from "lucide-react";

interface Props {
  activeTab: string;
  pendingCount: number;
  onTabChange: (tab: string) => void;
  onCreateClick: () => void;
}

export default function BottomNav({ activeTab, pendingCount, onTabChange, onCreateClick }: Props) {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "notifications", icon: Bell, label: "Alerts" },
    { id: "fab", icon: Plus, label: "" },
    { id: "activity", icon: Activity, label: "Activity" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[rgba(16,16,20,0.92)] backdrop-blur-[20px] border-t border-border flex items-center justify-around pt-2.5 pb-[18px] z-[100]">
      {navItems.map(item => {
        if (item.id === "fab") {
          return (
            <button
              key="fab"
              onClick={onCreateClick}
              className="w-[52px] h-[52px] rounded-2xl bg-squad-saffron flex items-center justify-center text-primary-foreground shadow-saffron transition-transform active:scale-[0.93] -mt-2.5"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          );
        }

        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer px-4 py-1 text-[11px] tracking-wide transition-colors relative ${
              isActive ? "text-squad-saffron" : "text-squad-text3"
            }`}
          >
            <Icon size={22} />
            {item.id === "notifications" && pendingCount > 0 && (
              <div className="absolute top-0.5 right-2.5 w-4 h-4 rounded-full bg-squad-saffron flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                {pendingCount}
              </div>
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
