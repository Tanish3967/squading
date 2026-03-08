import { useState } from "react";
import { Bell, Plus, Sparkles, Search, X, ChevronDown } from "lucide-react";
import { Activity, User, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import ActivityCard from "@/components/squad/ActivityCard";
import GlowOrb from "@/components/squad/GlowOrb";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullIndicator from "@/components/squad/PullIndicator";

interface Props {
  currentUser: User;
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
  onCreateClick: () => void;
  onRefresh?: () => Promise<void>;
}

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const DATE_OPTIONS = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export default function HomeScreen({ currentUser, activities, onActivityClick, onCreateClick, onRefresh }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const myInvites = activities.filter(a =>
    a.invitees.some(i => i.userId === currentUser.id && i.status === "pending")
  );
  const myActivities = activities.filter(a =>
    a.creatorId === currentUser.id || a.invitees.some(i => i.userId === currentUser.id && i.status === "accepted")
  );

  // Apply filters to myActivities
  const filteredActivities = myActivities.filter(a => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.location.toLowerCase().includes(q)) return false;
    }
    // Category
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    // Status
    if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
    // Date
    if (selectedDate !== "all") {
      const now = new Date();
      const actDate = new Date(a.date);
      if (selectedDate === "today") {
        if (actDate.toDateString() !== now.toDateString()) return false;
      } else if (selectedDate === "week") {
        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (actDate < now || actDate > weekFromNow) return false;
      } else if (selectedDate === "month") {
        if (actDate.getMonth() !== now.getMonth() || actDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all" || selectedDate !== "all";
  const activeFilterCount = [selectedCategory !== "all", selectedStatus !== "all", selectedDate !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedDate("all");
    setSearchQuery("");
  };

  const createdCount = activities.filter(a => a.creatorId === currentUser.id).length;
  const attendedCount = activities.filter(a => a.invitees.some(i => i.userId === currentUser.id && i.attended)).length;
  const depositedAmount = activities.reduce((sum, a) => {
    const inv = a.invitees.find(i => i.userId === currentUser.id && i.paid);
    return inv ? sum + a.deposit : sum;
  }, 0);

  const { containerRef, pullDistance, refreshing, handlers } = usePullToRefresh({
    onRefresh: onRefresh || (async () => {}),
  });

  return (
    <div
      ref={containerRef}
      {...handlers}
      className="min-h-screen flex flex-col pb-20 animate-fade-up overflow-y-auto"
    >
      <PullIndicator pullDistance={pullDistance} refreshing={refreshing} />
      {/* Header */}
      <div className="pt-[52px] px-6 pb-6 relative">
        <GlowOrb color="hsl(var(--primary))" size={250} top="-60px" right="-80px" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-muted-foreground text-[13px] mb-0.5">Hey,</p>
            <p className="font-display text-[22px] font-extrabold tracking-tight">{currentUser.name.split(" ")[0]} 👋</p>
          </div>
          <div className="flex gap-2.5 items-center">
            {myInvites.length > 0 && (
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center cursor-pointer">
                  <Bell size={20} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {myInvites.length}
                </div>
              </div>
            )}
            <SquadAvatar name={currentUser.name} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2.5 px-6 pb-6">
        {[
          { val: createdCount, label: "Created", color: "text-primary" },
          { val: attendedCount, label: "Attended", color: "text-[hsl(var(--squad-green))]" },
          { val: `₹${depositedAmount}`, label: "Deposited", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-0.5 p-3.5 bg-secondary border border-border rounded-2xl flex-1">
            <span className={`text-[22px] font-bold font-display ${s.color}`}>{s.val}</span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search activities…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3.5 rounded-xl border flex items-center gap-1.5 text-sm font-medium transition-all ${
              hasActiveFilters
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary border-border text-muted-foreground"
            }`}
          >
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filter chips */}
        {showFilters && (
          <div className="mt-3 flex flex-col gap-3 animate-fade-up">
            {/* Category filter */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">Category</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    selectedCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                  }`}
                >All</button>
                {ACTIVITY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                      selectedCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedStatus(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                      selectedStatus === opt.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Date filter */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">Date</p>
              <div className="flex flex-wrap gap-1.5">
                {DATE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedDate(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                      selectedDate === opt.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[12px] text-destructive font-medium self-start">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending invites section */}
      {myInvites.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex items-center gap-2 mb-3.5">
            <Sparkles size={14} className="text-primary" />
            <p className="font-display text-sm font-bold text-primary tracking-wide uppercase">
              Waiting for you ({myInvites.length})
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {myInvites.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id as string} onClick={onActivityClick} />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {myInvites.length > 0 && filteredActivities.length > 0 && (
        <div className="px-6 pb-4">
          <div className="h-px bg-border" />
        </div>
      )}

      {/* All activities */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3.5">
          <p className="font-display text-sm font-bold tracking-wide uppercase text-muted-foreground">Your Activities</p>
          <span className="text-[12px] text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{filteredActivities.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-border bg-secondary/30">
              <div className="text-[48px] mb-3">{searchQuery || hasActiveFilters ? "🔍" : "🎯"}</div>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery || hasActiveFilters
                  ? "No activities match your filters."
                  : <>No activities yet.<br />Create one and invite your squad!</>}
              </p>
              {searchQuery || hasActiveFilters ? (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium active:scale-95 transition-transform">
                  Clear filters
                </button>
              ) : (
                <button onClick={onCreateClick} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform">
                  <Plus size={16} /> Create Activity
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id as string} onClick={onActivityClick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
