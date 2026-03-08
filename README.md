# 🎯 Squad

**Plan together. Show up together. Get your money back when you do.**

Squad is a social commitment app that helps friend groups plan activities, put skin in the game with deposits, and reward those who actually show up.

## ✨ Features

- **Phone + TOTP Authentication** — Passwordless login using phone number and authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
- **Activity Creation & Management** — Create group activities with date, time, location, category, and deposit amounts
- **Invite System** — Invite friends via contacts, share links, or QR codes; track RSVPs in real-time
- **Deposit & Refund Flow** — Participants pay a deposit to commit; attended members get refunds
- **Attendance Tracking** — Creators mark attendance; the system handles refund eligibility
- **Push Notifications** — Web Push for activity reminders (1 day + 1 hour before), nudges, new messages, and invite alerts
- **In-Activity Chat** — Real-time comments/discussion within each activity
- **Waitlist** — Auto-managed waitlist when activities hit max capacity
- **PWA Support** — Installable on mobile with offline-ready service worker, home screen icons, and standalone mode
- **Dark-First Design** — Bold saffron + dark theme with grain texture, glow orbs, and smooth animations

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Lovable Cloud (Supabase) — Postgres, Edge Functions, Auth, Realtime |
| Auth | Phone + TOTP (RFC 6238) via otplib |
| Payments | PhonePe integration (deposit/refund) |
| Notifications | Web Push API with VAPID keys |
| PWA | Service Worker, Web App Manifest |

## 📁 Project Structure

```
src/
├── components/
│   ├── squad/          # App-specific components (ActivityCard, BottomNav, Avatar, etc.)
│   └── ui/             # shadcn/ui primitives
├── hooks/              # Custom hooks (useAuth, usePushNotifications, usePullToRefresh)
├── lib/                # Utilities, auth API, mock data
├── pages/              # Route screens (Home, Login, Profile, ActivityDetail, etc.)
└── integrations/       # Supabase client & types

supabase/
├── functions/          # Edge functions (auth, push, push-reminders, get-public-activity)
└── migrations/         # Database schema migrations
```

## 🚀 Getting Started

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd squad

# Install dependencies
npm install

# Start dev server
npm run dev
```

## 🌐 Deployment

The app is deployed at **[squading.lovable.app](https://squading.lovable.app)**

Built and deployed via [Lovable](https://lovable.dev).

## 📄 License

Private project. All rights reserved.
