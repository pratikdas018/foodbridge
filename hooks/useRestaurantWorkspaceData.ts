"use client";

import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

function useProvideRestaurantWorkspaceData() {
  const { user, profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [updatingScheduleId, setUpdatingScheduleId] = useState<string | null>(null);
  const [ratingsByDonationId, setRatingsByDonationId] = useState<Record<string, NgoRating>>({});
  const [ratingDonationId, setRatingDonationId] = useState<string | null>(null);
  const [ngoLookup, setNgoLookup] = useState<Record<string, AppUser>>({});
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDonations([]);
      setDonationsLoading(false);
      return;
    }

    setDonationsLoading(true);
    const unsubscribe = subscribeRestaurantDonations(
      user.uid,
      (nextDonations) => {
        setDonations(nextDonations);
        setDonationsLoading(false);
      },
      () => {
        setDonationsLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSchedules([]);
      setSchedulesLoading(false);
      return;
    }

    setSchedulesLoading(true);
    const unsubscribe = subscribeRestaurantSchedules(
      user.uid,
      (nextSchedules) => {
        setSchedules(nextSchedules);
        setSchedulesLoading(false);
      },
      () => {
        setSchedulesLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRatingsByDonationId({});
      setRatingsLoading(false);
      return;
    }

    setRatingsLoading(true);
    const unsubscribe = subscribeRestaurantRatings(
      user.uid,
      (ratings) => {
        const lookup = ratings.reduce<Record<string, NgoRating>>((acc, rating) => {
          acc[rating.donationId] = rating;
          return acc;
        }, {});

        setRatingsByDonationId(lookup);
        setRatingsLoading(false);
      },
      () => {
        setRatingsLoading(false);
      },
    );

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

  const donationLookup = useMemo(() => {
    return donations.reduce<Record<string, Donation>>((acc, donation) => {
      acc[donation.id] = donation;
      return acc;
    }, {});
  }, [donations]);

  const schedulesByDonationId = useMemo(() => {
    return schedules.reduce<Record<string, PickupSchedule>>((acc, schedule) => {
      acc[schedule.donationId] = schedule;
      return acc;
    }, {});
  }, [schedules]);

  return {
    user,
    profile,
    donations,
    schedules,
    donationLookup,
    schedulesByDonationId,
    ratingsByDonationId,
    donationsLoading,
    schedulesLoading,
    ratingsLoading,
    ratingDonationId,
    updatingScheduleId,
    ngoLookup,
    handleApproveSchedule,
    handleRejectSchedule,
    handleRateNgo,
  };
}

type RestaurantWorkspaceContextValue = ReturnType<typeof useProvideRestaurantWorkspaceData>;

const RestaurantWorkspaceContext =
  createContext<RestaurantWorkspaceContextValue | undefined>(undefined);

export function RestaurantWorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useProvideRestaurantWorkspaceData();

  return createElement(RestaurantWorkspaceContext.Provider, { value }, children);
}

export function useRestaurantWorkspaceData() {
  const context = useContext(RestaurantWorkspaceContext);

  if (!context) {
    throw new Error(
      "useRestaurantWorkspaceData must be used within RestaurantWorkspaceProvider.",
    );
  }

  return context;
}
