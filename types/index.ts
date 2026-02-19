import type { Timestamp } from "firebase/firestore";

export type UserRole = "restaurant" | "ngo" | "admin";
export type NgoAvailabilityStatus = "available" | "busy";
export type DonationStatus = "available" | "claimed" | "in_progress" | "completed";
export type PickupStatus = "claimed" | "in_progress" | "completed";
export type ScheduleStatus = "pending" | "approved" | "rejected";
export type FreshnessRiskLevel = "low" | "medium" | "high";
export type NotificationType =
  | "new_donation"
  | "donation_claimed"
  | "claim_confirmed"
  | "pickup_completed"
  | "schedule_requested"
  | "schedule_approved"
  | "schedule_rejected";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  availabilityStatus: NgoAvailabilityStatus;
  createdAt: Timestamp | null;
}

export interface Donation {
  id: string;
  restaurantId: string;
  foodName: string;
  quantity: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  freshnessRiskLevel: FreshnessRiskLevel;
  pickupPriorityScore: number;
  aiAnalysisReason: string;
  imageUrl: string;
  videoUrl: string;
  proofImageUrl: string;
  availableTill: Timestamp | null;
  status: DonationStatus;
  completedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface Claim {
  id: string;
  donationId: string;
  ngoId: string;
  claimedAt: Timestamp | null;
  pickupStatus: PickupStatus;
  proofImageUrl: string;
  completedAt: Timestamp | null;
}

export interface PickupSchedule {
  id: string;
  claimId: string;
  donationId: string;
  ngoId: string;
  restaurantId: string;
  pickupTime: Timestamp | null;
  status: ScheduleStatus;
  rejectionReason: string;
  requestedAt: Timestamp | null;
  decidedAt: Timestamp | null;
}

export interface NgoRating {
  id: string;
  donationId: string;
  claimId: string;
  ngoId: string;
  restaurantId: string;
  rating: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface NgoRatingSummary {
  averageRating: number;
  totalRatings: number;
}

export interface AppNotification {
  id: string;
  recipientKey: string;
  actorId: string;
  actorRole: UserRole;
  donationId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "restaurant" | "ngo">;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AddDonationPayload {
  foodName: string;
  quantity: string;
  address: string;
  latitude: number;
  longitude: number;
  availableTill: string;
  description: string;
  imageFile?: File | null;
  videoFile?: File | null;
}
