"use client";

import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
import type {
  AppUser,
  Claim,
  Donation,
  NgoRatingSummary,
  PickupSchedule,
} from "@/types";

function useProvideNgoWorkspaceData() {
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
  const [availableDonationsLoading, setAvailableDonationsLoading] = useState(true);
  const [claimHistoryLoading, setClaimHistoryLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [ratingSummaryLoading, setRatingSummaryLoading] = useState(true);

  useEffect(() => {
    setAvailableDonationsLoading(true);
    const unsubscribe = subscribeAvailableDonations(
      (donations) => {
        setAvailableDonations(donations);
        setAvailableDonationsLoading(false);
      },
      () => {
        setAvailableDonationsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setClaimHistory([]);
      setClaimHistoryLoading(false);
      return;
    }

    setClaimHistoryLoading(true);
    const unsubscribe = subscribeNgoClaims(
      user.uid,
      (claims) => {
        setClaimHistory(claims);
        setClaimHistoryLoading(false);
      },
      () => {
        setClaimHistoryLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRatingSummary({
        averageRating: 0,
        totalRatings: 0,
      });
      setRatingSummaryLoading(false);
      return;
    }

    setRatingSummaryLoading(true);
    const unsubscribe = subscribeNgoRatingSummary(
      user.uid,
      (summary) => {
        setRatingSummary(summary);
        setRatingSummaryLoading(false);
      },
      () => {
        setRatingSummaryLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setScheduleLookup({});
      setSchedulesLoading(false);
      return;
    }

    setSchedulesLoading(true);
    const unsubscribe = subscribeNgoSchedules(
      user.uid,
      (schedules) => {
        const lookup = schedules.reduce<Record<string, PickupSchedule>>((acc, schedule) => {
          acc[schedule.claimId] = schedule;
          return acc;
        }, {});

        setScheduleLookup(lookup);
        setSchedulesLoading(false);
      },
      () => {
        setSchedulesLoading(false);
        toast.error("Failed to load pickup schedules.");
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
      const message = error instanceof Error ? error.message : "Failed to complete donation.";
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

    const nextStatus = profile.availabilityStatus === "available" ? "busy" : "available";

    try {
      setIsUpdatingAvailability(true);
      await updateNgoAvailabilityStatus(user.uid, nextStatus);
      await refreshProfile();
      toast.success(nextStatus === "available" ? "Status updated: Available." : "Status updated: Busy.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update availability status.";
      toast.error(message);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const canClaim = profile?.isVerified === true && profile?.availabilityStatus === "available";

  const claimDisabledReason =
    profile?.isVerified !== true
      ? "Verification Required"
      : profile?.availabilityStatus !== "available"
        ? "Set Available First"
        : "Claim Disabled";

  return {
    user,
    profile,
    availableDonations,
    claimHistory,
    donationLookup,
    scheduleLookup,
    ratingSummary,
    userLookup,
    availableDonationsLoading,
    claimHistoryLoading,
    schedulesLoading,
    ratingSummaryLoading,
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

type NgoWorkspaceContextValue = ReturnType<typeof useProvideNgoWorkspaceData>;

const NgoWorkspaceContext = createContext<NgoWorkspaceContextValue | undefined>(undefined);

export function NgoWorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useProvideNgoWorkspaceData();

  return createElement(NgoWorkspaceContext.Provider, { value }, children);
}

export function useNgoWorkspaceData() {
  const context = useContext(NgoWorkspaceContext);

  if (!context) {
    throw new Error("useNgoWorkspaceData must be used within NgoWorkspaceProvider.");
  }

  return context;
}
