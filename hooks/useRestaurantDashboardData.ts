"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { subscribeRestaurantDonations } from "@/services/donation.service";
import {
  submitNgoRating,
  subscribeRestaurantRatings,
} from "@/services/rating.service";
import {
  reviewPickupSchedule,
  subscribeRestaurantSchedules,
} from "@/services/schedule.service";
import { fetchUsersByIds } from "@/services/user.service";
import type { AppUser, Donation, NgoRating, PickupSchedule } from "@/types";

export function useRestaurantDashboardData() {
  const { user, profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [updatingScheduleId, setUpdatingScheduleId] = useState<string | null>(null);
  const [ratingsByDonationId, setRatingsByDonationId] = useState<Record<string, NgoRating>>({});
  const [ratingDonationId, setRatingDonationId] = useState<string | null>(null);
  const [ngoLookup, setNgoLookup] = useState<Record<string, AppUser>>({});

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeRestaurantDonations(user.uid, setDonations);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeRestaurantSchedules(user.uid, setSchedules);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const ngoIds = schedules.map((schedule) => schedule.ngoId);

    if (ngoIds.length === 0) {
      setNgoLookup({});
      return;
    }

    fetchUsersByIds(ngoIds)
      .then(setNgoLookup)
      .catch(() => setNgoLookup({}));
  }, [schedules]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeRestaurantRatings(user.uid, (ratings) => {
      const lookup = ratings.reduce<Record<string, NgoRating>>((acc, rating) => {
        acc[rating.donationId] = rating;
        return acc;
      }, {});

      setRatingsByDonationId(lookup);
    });

    return unsubscribe;
  }, [user]);

  const handleApproveSchedule = async (scheduleId: string) => {
    if (!user) {
      return;
    }

    try {
      setUpdatingScheduleId(scheduleId);
      await reviewPickupSchedule(scheduleId, user.uid, "approved");
      toast.success("Pickup schedule approved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve pickup schedule.";
      toast.error(message);
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const handleRejectSchedule = async (scheduleId: string, reason: string) => {
    if (!user) {
      return;
    }

    try {
      setUpdatingScheduleId(scheduleId);
      await reviewPickupSchedule(scheduleId, user.uid, "rejected", reason);
      toast.success("Pickup schedule rejected.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject pickup schedule.";
      toast.error(message);
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const handleRateNgo = async (payload: {
    donationId: string;
    claimId: string;
    ngoId: string;
    rating: number;
  }) => {
    if (!user) {
      return;
    }

    try {
      setRatingDonationId(payload.donationId);
      await submitNgoRating({
        ...payload,
        restaurantId: user.uid,
      });
      toast.success("NGO rated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit NGO rating.";
      toast.error(message);
    } finally {
      setRatingDonationId(null);
    }
  };

  const donationLookup = useMemo(
    () =>
      donations.reduce<Record<string, Donation>>((acc, donation) => {
        acc[donation.id] = donation;
        return acc;
      }, {}),
    [donations],
  );

  const schedulesByDonationId = useMemo(
    () =>
      schedules.reduce<Record<string, PickupSchedule>>((acc, schedule) => {
        acc[schedule.donationId] = schedule;
        return acc;
      }, {}),
    [schedules],
  );

  const completedDonations = useMemo(
    () => donations.filter((donation) => donation.status === "completed"),
    [donations],
  );

  return {
    user,
    profile,
    donations,
    completedDonations,
    schedules,
    donationLookup,
    schedulesByDonationId,
    ngoLookup,
    ratingsByDonationId,
    updatingScheduleId,
    ratingDonationId,
    handleApproveSchedule,
    handleRejectSchedule,
    handleRateNgo,
  };
}
