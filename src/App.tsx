import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import CreateActivityScreen from "./pages/CreateActivityScreen";
import ActivityDetailScreen from "./pages/ActivityDetailScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import BottomNav from "./components/squad/BottomNav";
import { User, Activity, SAMPLE_ACTIVITIES } from "@/lib/mock-data";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [screen, setScreen] = useState("home");
  const [activities, setActivities] = useState<Activity[]>(SAMPLE_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setScreen("home");
    setActiveTab("home");
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setScreen("detail");
  };

  const handleUpdateActivity = (updated: Activity) => {
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedActivity(updated);
  };

  const handleCreateActivity = (newActivity: Activity) => {
    setActivities(prev => [newActivity, ...prev]);
    setScreen("home");
    setActiveTab("home");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setScreen(tab);
  };

  if (!isLoggedIn) {
    return (
      <>
        <div className="grain-overlay" />
        <div className="max-w-[430px] mx-auto min-h-screen bg-background relative overflow-hidden">
          <LoginScreen onLogin={handleLogin} />
        </div>
        <Toaster />
      </>
    );
  }

  const pendingCount = activities.filter(a =>
    a.invitees.some(i => i.userId === currentUser!.id && i.status === "pending")
  ).length;

  const renderScreen = () => {
    if (screen === "create") {
      return (
        <CreateActivityScreen
          currentUser={currentUser!}
          onBack={() => { setScreen("home"); setActiveTab("home"); }}
          onCreate={handleCreateActivity}
        />
      );
    }
    if (screen === "detail" && selectedActivity) {
      return (
        <ActivityDetailScreen
          activity={selectedActivity}
          currentUser={currentUser!}
          onBack={() => setScreen(activeTab)}
          onUpdateActivity={handleUpdateActivity}
        />
      );
    }
    if (activeTab === "notifications") {
      return <NotificationsScreen currentUser={currentUser!} activities={activities} onActivityClick={handleActivityClick} />;
    }
    if (activeTab === "profile") {
      return <ProfileScreen currentUser={currentUser!} activities={activities} onLogout={handleLogout} />;
    }
    return (
      <HomeScreen
        currentUser={currentUser!}
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
};

export default App;
