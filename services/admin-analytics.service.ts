"use client";

import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";

export interface AdminAnalytics {
  totalDonations: number;
  completedDonations: number;
  claimedDonations: number;
  totalNgos: number;
  totalRestaurants: number;
  refreshedAt: Date;
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const db = getClientDb();
  const donationsCollection = collection(db, COLLECTIONS.DONATIONS);
  const usersCollection = collection(db, COLLECTIONS.USERS);

  const [
    totalDonationsSnapshot,
    completedDonationsSnapshot,
    claimedDonationsSnapshot,
    ngoUsersSnapshot,
    restaurantUsersSnapshot,
  ] = await Promise.all([
    getCountFromServer(donationsCollection),
    getCountFromServer(
      query(donationsCollection, where("status", "in", ["completed", "picked"])),
    ),
    getCountFromServer(query(donationsCollection, where("status", "==", "claimed"))),
    getCountFromServer(query(usersCollection, where("role", "==", "ngo"))),
    getCountFromServer(query(usersCollection, where("role", "==", "restaurant"))),
  ]);

  return {
    totalDonations: totalDonationsSnapshot.data().count,
    completedDonations: completedDonationsSnapshot.data().count,
    claimedDonations: claimedDonationsSnapshot.data().count,
    totalNgos: ngoUsersSnapshot.data().count,
    totalRestaurants: restaurantUsersSnapshot.data().count,
    refreshedAt: new Date(),
  };
}
