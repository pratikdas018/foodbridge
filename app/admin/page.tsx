"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminAnalyticsCards } from "@/components/admin/AdminAnalyticsCards";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DonationsAdminTable } from "@/components/admin/DonationsAdminTable";
import { UsersTable } from "@/components/admin/UsersTable";
import { useAuth } from "@/hooks/useAuth";
import { subscribeAllDonations } from "@/services/donation.service";
import { subscribeAllUsers } from "@/services/user.service";
import type { AppUser, Donation } from "@/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    const unsubscribeUsers = subscribeAllUsers(setUsers);
    const unsubscribeDonations = subscribeAllDonations(setDonations);

    return () => {
      unsubscribeUsers();
      unsubscribeDonations();
    };
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardShell
        title="Admin Dashboard"
        subtitle="Manage users, donations, and donation statuses."
        tone="admin"
      >
        <AdminAnalyticsCards />
        <UsersTable users={users} currentAdminUid={user?.uid ?? null} />
        <DonationsAdminTable donations={donations} />
      </DashboardShell>
    </ProtectedRoute>
  );
}
