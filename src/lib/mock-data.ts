export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

export interface Invitee {
  userId: string;
  status: "accepted" | "declined" | "pending";
  paid: boolean;
  attended: boolean;
}

export interface Activity {
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
  invitees: Invitee[];
  status: "upcoming" | "completed" | "cancelled";
}

export const ACTIVITY_CATEGORIES = [
  { id: "trek", label: "Trek", icon: "⛰️" },
  { id: "sports", label: "Sports", icon: "🏏" },
  { id: "party", label: "Party", icon: "🎉" },
  { id: "food", label: "Food Run", icon: "🍜" },
  { id: "movie", label: "Movie", icon: "🎬" },
  { id: "travel", label: "Travel", icon: "✈️" },
];