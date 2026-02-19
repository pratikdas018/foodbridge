# FoodBridge - Food Waste Donation Platform

FoodBridge is a full-stack role-based platform that connects restaurants with NGOs to reduce food waste and deliver surplus meals to people in need.

Built with Next.js App Router + Firebase + Cloudinary, the app supports real-time donation flow, claim lifecycle tracking, schedule approval, proof-based completion, ratings, notifications, analytics, and branded PDF receipts.

## Live Product Focus
- Reduce edible food waste.
- Improve pickup coordination between restaurants and verified NGOs.
- Provide transparent, trackable, and auditable donation operations.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firestore Database (real-time)
- Firebase Admin SDK (server session + protected APIs)
- Cloudinary (image/video storage)
- Gemini API (AI freshness risk + pickup priority)
- jsPDF (client-side receipt generation)
- react-hot-toast (toasts)

## User Roles
- Restaurant
- NGO
- Admin

## Core Features

### Authentication + Security
- Email/password signup/login/logout with Firebase Auth.
- Role stored in Firestore `users` collection.
- Session cookies via `/api/session/login` and `/api/session/logout`.
- Middleware-based role route protection.
- Firestore rules for role-aware read/write enforcement.

### Restaurant Workflow
- Create donation with:
  - Food name, quantity, address, availability date/time, description
  - Map-picked coordinates (latitude/longitude)
  - Image/video upload to Cloudinary
- Track donation lifecycle:
  - `available -> claimed -> in_progress -> completed`
- Review NGO pickup schedule requests (approve/reject).
- View proof image uploaded after completion.
- Rate NGO after completed donation.
- Download official pickup receipt PDF.

### NGO Workflow
- View available donations in real-time.
- Claim donation (verified + available NGOs only).
- Submit pickup slot for restaurant approval.
- Mark pickup `in_progress` and then `completed`.
- Upload proof image at completion.
- Toggle NGO availability (`available` / `busy`).
- View ratings summary and download receipts.

### Admin Workflow
- Manage users and donations.
- NGO verification management.
- Donation status moderation.
- Analytics cards and aggregate metrics.

### Platform Enhancements
- Real-time notification feed with notification sounds.
- AI scoring for donation freshness risk and pickup priority.
- Homepage impact dashboard + social impact sections.
- Multi-page routed NGO/Restaurant workspaces with responsive sidebar/drawer.
- Skeleton loaders for dashboard loading states.
- Animated dashboard route transitions.

## Dashboard Route Architecture

### NGO
- `/ngo/dashboard`
- `/ngo/profile`
- `/ngo/availability`
- `/ngo/claims`
- `/ngo/receipts`

### Restaurant
- `/restaurant/dashboard`
- `/restaurant/donations`
- `/restaurant/schedules`
- `/restaurant/actions`
- `/restaurant/receipts`

### Admin
- `/admin`

### Public
- `/`
- `/login`
- `/register`
- `/unauthorized`

## Firestore Collections

### `users`
```ts
{
  uid: string;
  name: string;
  email: string;
  role: "restaurant" | "ngo" | "admin";
  isVerified: boolean;
  availabilityStatus: "available" | "busy";
  createdAt: Timestamp | null;
}
```

### `donations`
```ts
{
  restaurantId: string;
  foodName: string;
  quantity: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  freshnessRiskLevel: "low" | "medium" | "high";
  pickupPriorityScore: number; // 1-5
  aiAnalysisReason: string;
  imageUrl: string;
  videoUrl: string;
  proofImageUrl: string;
  availableTill: Timestamp | null;
  status: "available" | "claimed" | "in_progress" | "completed";
  completedAt: Timestamp | null;
  createdAt: Timestamp | null;
}
```

### `claims`
```ts
{
  donationId: string;
  ngoId: string;
  claimedAt: Timestamp | null;
  pickupStatus: "claimed" | "in_progress" | "completed";
  proofImageUrl: string;
  completedAt: Timestamp | null;
}
```

### `schedules`
```ts
{
  claimId: string;
  donationId: string;
  ngoId: string;
  restaurantId: string;
  pickupTime: Timestamp | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  requestedAt: Timestamp | null;
  decidedAt: Timestamp | null;
}
```

### `ratings`
```ts
{
  donationId: string; // used as doc id
  claimId: string;
  ngoId: string;
  restaurantId: string;
  rating: number; // 1-5
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
```

### `notifications`
```ts
{
  recipientKey: string; // user id or role:* (server-created)
  actorId: string;
  actorRole: "restaurant" | "ngo" | "admin";
  donationId: string;
  type:
    | "new_donation"
    | "donation_claimed"
    | "claim_confirmed"
    | "pickup_completed"
    | "schedule_requested"
    | "schedule_approved"
    | "schedule_rejected";
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}
```

## Environment Variables
Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

FIREBASE_SERVICE_ACCOUNT_KEY=
# OR provide these fields individually:
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GEMINI_API_KEY=
```

## Local Setup

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Production Build

```bash
npm run build
npm run start
```

## Firebase Setup Notes
- Enable Email/Password in Firebase Authentication.
- Create Firestore database.
- Add/update Firestore rules from `firestore.rules`.
- Create at least one admin user by setting `role: "admin"` in Firestore for that auth user.

## Key API Routes
- `POST /api/session/login`
- `POST /api/session/logout`
- `POST /api/upload/cloudinary`
- `POST /api/notifications/create`
- `POST /api/ai/analyze-donation`
- `GET /api/impact-stats`

## Project Structure (High Level)
```text
app/
  admin/
  api/
  ngo/
  restaurant/
  login/
  register/
  unauthorized/
components/
  admin/
  home/
  layout/
  ngo/
  restaurant/
  ui/
hooks/
lib/
services/
types/
firestore.rules
middleware.ts
```

## Author
- Pratik Das
- Portfolio: https://pratik-web.vercel.app/
- GitHub: https://github.com/pratikdas018
- LinkedIn: https://www.linkedin.com/in/pratik018/
