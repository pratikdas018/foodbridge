"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  claimDonation,
  subscribeNgoClaims,
  updateClaimPickupStatus,
} from "@/services/claim.service";
import {
  fetchDonationsByIds,
  subscribeAvailableDonations,
} from "@/services/donation.service";
import { subscribeNgoRatingSummary } from "@/services/rating.service";
import {
  requestPickupSchedule,
  subscribeNgoSchedules,
} from "@/services/schedule.service";
import {
  fetchUsersByIds,
  updateNgoAvailabilityStatus,
} from "@/services/user.service";
import type { AppUser, Claim, Donation, NgoRatingSummary, PickupSchedule } from "@/types";

export function useNgoDashboardData() {
  const { user, profile, refreshProfile } = useAuth();
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [claimHistory, setClaimHistory] = useState<Claim[]>([]);
  const [donationLookup, setDonationLookup] = useState<Record<string, Donation>>({});
  const [scheduleLookup, setScheduleLookup] = useState<Record<string, PickupSchedule>>({});
  const [claimingDonationId, setClaimingDonationId] = useState<string | null>(null);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);
  const [schedulingClaimId, setSchedulingClaimId] = useState<string | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<NgoRatingSummary>({
    averageRating: 0,
    totalRatings: 0,
  });
  const [userLookup, setUserLookup] = useState<Record<string, AppUser>>({});

  useEffect(() => {
    const unsubscribe = subscribeAvailableDonations(setAvailableDonations);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeNgoClaims(user.uid, setClaimHistory);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeNgoRatingSummary(user.uid, setRatingSummary);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeNgoSchedules(
      user.uid,
      (schedules) => {
        const lookup = schedules.reduce<Record<string, PickupSchedule>>((acc, schedule) => {
          acc[schedule.claimId] = schedule;
          return acc;
        }, {});

        setScheduleLookup(lookup);
      },
      (error) => {
        toast.error("Failed to load pickup schedules.");
        console.warn("Ngo schedule subscription failed.", error);
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const donationIds = claimHistory.map((claim) => claim.donationId);

    if (donationIds.length === 0) {
      setDonationLookup({});
      return;
    }

    fetchDonationsByIds(donationIds)
      .then(setDonationLookup)
      .catch(() => setDonationLookup({}));
  }, [claimHistory]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const restaurantIds = Object.values(donationLookup).map((donation) => donation.restaurantId);
    const userIds = [...restaurantIds, user.uid];

    if (userIds.length === 0) {
      setUserLookup({});
      return;
    }

    fetchUsersByIds(userIds)
      .then(setUserLookup)
      .catch(() => setUserLookup({}));
  }, [donationLookup, user]);

  const handleClaim = async (donationId: string) => {
    if (!user) {
      return;
    }

    try {
      setClaimingDonationId(donationId);
      await claimDonation(donationId, user.uid);
      toast.success("Donation claimed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to claim donation.";
      toast.error(message);
    } finally {
      setClaimingDonationId(null);
    }
  };

  const handleMarkInProgress = async (claimId: string) => {
    if (!user) {
      return;
    }

    try {
      setUpdatingClaimId(claimId);
      await updateClaimPickupStatus(claimId, user.uid, "in_progress");
      toast.success("Pickup marked as in progress.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update pickup status.";
      toast.error(message);
    } finally {
      setUpdatingClaimId(null);
    }
  };

  const handleMarkCompleted = async (claimId: string, proofImageFile: File) => {
    if (!user) {
      return;
    }

    try {
      setUpdatingClaimId(claimId);
      await updateClaimPickupStatus(claimId, user.uid, "completed", {
        proofImageFile,
      });
      toast.success("Donation marked completed with proof image.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete donation.";
      toast.error(message);
    } finally {
      setUpdatingClaimId(null);
    }
  };

  const handleSchedulePickup = async (claimId: string, pickupTimeIso: string) => {
    if (!user) {
      return;
    }

    try {
      setSchedulingClaimId(claimId);
      await requestPickupSchedule(claimId, user.uid, pickupTimeIso);
      toast.success("Pickup slot submitted for restaurant approval.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit pickup schedule.";
      toast.error(message);
    } finally {
      setSchedulingClaimId(null);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!user || !profile) {
      return;
    }

    const nextStatus =
      profile.availabilityStatus === "available" ? "busy" : "available";

    try {
      setIsUpdatingAvailability(true);
      await updateNgoAvailabilityStatus(user.uid, nextStatus);
      await refreshProfile();
      toast.success(
        nextStatus === "available" ? "Status updated: Available." : "Status updated: Busy.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update availability status.";
      toast.error(message);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const canClaim =
    profile?.isVerified === true && profile?.availabilityStatus === "available";

  const claimDisabledReason =
    profile?.isVerified !== true
      ? "Verification Required"
      : profile?.availabilityStatus !== "available"
        ? "Set Available First"
        : "Claim Disabled";

  const completedClaims = useMemo(
    () => claimHistory.filter((claim) => claim.pickupStatus === "completed"),
    [claimHistory],
  );

  return {
    user,
    profile,
    availableDonations,
    claimHistory,
    completedClaims,
    donationLookup,
    scheduleLookup,
    userLookup,
    ratingSummary,
    claimingDonationId,
    updatingClaimId,
    schedulingClaimId,
    isUpdatingAvailability,
    canClaim,
    claimDisabledReason,
    handleClaim,
    handleMarkInProgress,
    handleMarkCompleted,
    handleSchedulePickup,
    handleAvailabilityToggle,
  };
}
