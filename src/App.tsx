import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import CreateActivityScreen from "./pages/CreateActivityScreen";
import ActivityDetailScreen from "./pages/ActivityDetailScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import ContactsScreen from "./pages/ContactsScreen";
import BottomNav from "./components/squad/BottomNav";
import { AuthProvider, useAuth, Profile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Bridge type to keep UI components working with minimal changes
interface AppUser {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

interface AppInvitee {
  userId: string;
  status: "accepted" | "declined" | "pending";
  paid: boolean;
  attended: boolean;
}

interface AppActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  deposit: number;
  maxPeople: number;
  description: string;
  creatorId: string;
  invitees: AppInvitee[];
  status: "upcoming" | "completed" | "cancelled";
}

function profileToAppUser(p: Profile): AppUser {
  const initials = (p.name || "User")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return {
    id: p.id,
    name: p.name || "Squad Member",
    phone: p.phone,
    avatar: initials,
  };
}

function AppContent() {
  const { profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [screen, setScreen] = useState("home");
  const [activities, setActivities] = useState<AppActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<AppActivity | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const currentUser = profile ? profileToAppUser(profile) : null;

  // Fetch activities from database
  useEffect(() => {
    if (!profile) return;
    
    async function fetchActivities() {
      setLoadingActivities(true);
      const { data: acts } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (acts) {
        // Fetch invitees for all activities
        const actIds = acts.map((a) => a.id);
        const { data: invitees } = await supabase
          .from("invitees")
          .select("*")
          .in("activity_id", actIds.length > 0 ? actIds : ["__none__"]);

        const mapped: AppActivity[] = acts.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          date: a.date,
          time: a.time,
          location: a.location,
          deposit: a.deposit,
          maxPeople: a.max_people,
          description: a.description || "",
          creatorId: a.creator_id,
          invitees: (invitees || [])
            .filter((i) => i.activity_id === a.id)
            .map((i) => ({
              userId: i.user_id,
              status: i.status as "accepted" | "declined" | "pending",
              paid: i.paid,
              attended: i.attended,
            })),
          status: a.status as "upcoming" | "completed" | "cancelled",
        }));
        setActivities(mapped);
      }
      setLoadingActivities(false);
    }

    fetchActivities();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-squad-saffron animate-pulse-soft text-xl font-display font-bold">Loading…</div>
      </div>
    );
  }

  if (!profile || !currentUser) {
    return (
      <>
        <div className="grain-overlay" />
        <div className="max-w-[430px] mx-auto min-h-screen bg-background relative overflow-hidden">
          <LoginScreen />
        </div>
        <Toaster />
      </>
    );
  }

  const handleLogout = async () => {
    await signOut();
    setScreen("home");
    setActiveTab("home");
  };

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setScreen("detail");
  };

  const handleUpdateActivity = async (updated: AppActivity) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedActivity(updated);
  };

  const handleCreateActivity = async (newActivity: any) => {
    // Insert activity into database
    const { data: created, error } = await supabase
      .from("activities")
      .insert({
        title: newActivity.title,
        category: newActivity.category,
        date: newActivity.date,
        time: newActivity.time,
        location: newActivity.location,
        deposit: newActivity.deposit,
        max_people: newActivity.maxPeople,
        description: newActivity.description,
        creator_id: currentUser.id,
      })
      .select()
      .single();

    if (error || !created) return;

    // Insert invitees
    if (newActivity.invitees?.length > 0) {
      await supabase.from("invitees").insert(
        newActivity.invitees.map((inv: any) => ({
          activity_id: created.id,
          user_id: inv.userId,
          status: "pending",
        }))
      );
    }

    // Add to local state
    const appActivity: AppActivity = {
      id: created.id,
      title: created.title,
      category: created.category,
      date: created.date,
      time: created.time,
      location: created.location,
      deposit: created.deposit,
      maxPeople: created.max_people,
      description: created.description || "",
      creatorId: created.creator_id,
      invitees: (newActivity.invitees || []).map((inv: any) => ({
        userId: inv.userId,
        status: "pending" as const,
        paid: false,
        attended: false,
      })),
      status: "upcoming",
    };
    setActivities((prev) => [appActivity, ...prev]);
    setScreen("home");
    setActiveTab("home");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setScreen(tab);
  };

  const pendingCount = activities.filter((a) =>
    a.invitees.some((i) => i.userId === currentUser.id && i.status === "pending")
  ).length;

  const renderScreen = () => {
    if (screen === "contacts") {
      return <ContactsScreen onBack={() => { setScreen("profile"); setActiveTab("profile"); }} />;
    }
    if (screen === "create") {
      return (
        <CreateActivityScreen
          currentUser={currentUser}
          onBack={() => { setScreen("home"); setActiveTab("home"); }}
          onCreate={handleCreateActivity}
        />
      );
    }
    if (screen === "detail" && selectedActivity) {
      return (
        <ActivityDetailScreen
          activity={selectedActivity}
          currentUser={currentUser}
          onBack={() => setScreen(activeTab)}
          onUpdateActivity={handleUpdateActivity}
        />
      );
    }
    if (activeTab === "notifications") {
      return <NotificationsScreen currentUser={currentUser} activities={activities} onActivityClick={handleActivityClick} />;
    }
    if (activeTab === "profile") {
      return <ProfileScreen currentUser={currentUser} activities={activities} onLogout={handleLogout} />;
    }
    return (
      <HomeScreen
        currentUser={currentUser}
        activities={activities}
        onActivityClick={handleActivityClick}
        onCreateClick={() => { setScreen("create"); setActiveTab("create"); }}
      />
    );
  };

  return (
    <>
      <div className="grain-overlay" />
      <div className="max-w-[430px] mx-auto min-h-screen bg-background relative overflow-hidden">
        {renderScreen()}
        {screen !== "create" && screen !== "detail" && (
          <BottomNav
            activeTab={activeTab}
            pendingCount={pendingCount}
            onTabChange={handleTabChange}
            onCreateClick={() => { setScreen("create"); setActiveTab("create"); }}
          />
        )}
      </div>
      <Toaster />
    </>
  );
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
