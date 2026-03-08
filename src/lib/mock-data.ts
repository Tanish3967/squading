export interface User {
  id: number;
  name: string;
  phone: string;
  avatar: string;
}

export interface Invitee {
  userId: number;
  status: "accepted" | "declined" | "pending";
  paid: boolean;
  attended: boolean;
}

export interface Activity {
  id: number;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  deposit: number;
  maxPeople: number;
  description: string;
  creatorId: number;
  invitees: Invitee[];
  status: "upcoming" | "completed" | "cancelled";
}

export const MOCK_USERS: User[] = [
  { id: 1, name: "Arjun Mehta", phone: "9876543210", avatar: "AM" },
  { id: 2, name: "Priya Sharma", phone: "9123456789", avatar: "PS" },
  { id: 3, name: "Rohit Das", phone: "9988776655", avatar: "RD" },
  { id: 4, name: "Sneha Iyer", phone: "9001122334", avatar: "SI" },
  { id: 5, name: "Vikram Nair", phone: "9765432100", avatar: "VN" },
  { id: 6, name: "Kavya Reddy", phone: "9654321098", avatar: "KR" },
];

export const ACTIVITY_CATEGORIES = [
  { id: "trek", label: "Trek", icon: "⛰️" },
  { id: "sports", label: "Sports", icon: "🏏" },
  { id: "party", label: "Party", icon: "🎉" },
  { id: "food", label: "Food Run", icon: "🍜" },
  { id: "movie", label: "Movie", icon: "🎬" },
  { id: "travel", label: "Travel", icon: "✈️" },
];

export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: 101,
    title: "Sinhagad Fort Trek",
    category: "trek",
    date: "2026-03-22",
    time: "06:00",
    location: "Pune, Maharashtra",
    deposit: 199,
    maxPeople: 12,
    description: "Early morning trek to Sinhagad. Meeting at Swargate at 5:30am. Breakfast at the top!",
    creatorId: 2,
    invitees: [
      { userId: 1, status: "accepted", paid: true, attended: false },
      { userId: 3, status: "accepted", paid: true, attended: false },
      { userId: 4, status: "pending", paid: false, attended: false },
      { userId: 5, status: "declined", paid: false, attended: false },
    ],
    status: "upcoming",
  },
  {
    id: 102,
    title: "Sunday Cricket at Oval Maidan",
    category: "sports",
    date: "2026-03-15",
    time: "07:00",
    location: "Mumbai, Maharashtra",
    deposit: 99,
    maxPeople: 22,
    description: "Friendly 20-over match. Bring your own bat if you have one. Teams will be decided on spot.",
    creatorId: 1,
    invitees: [
      { userId: 2, status: "accepted", paid: true, attended: true },
      { userId: 3, status: "accepted", paid: true, attended: true },
      { userId: 6, status: "accepted", paid: true, attended: false },
    ],
    status: "completed",
  },
];
