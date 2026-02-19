"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getClientAuth } from "@/lib/firebase/config";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, profile, user } = useAuth();
  const hasClientAuthUser =
    typeof window !== "undefined" ? Boolean(getClientAuth().currentUser) : false;
  const hasAuthUser = Boolean(user) || hasClientAuthUser;

  const isAllowed = Boolean(hasAuthUser && profile && allowedRoles.includes(profile.role));

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasAuthUser) {
      router.replace("/login");
      return;
    }

    // Wait until profile is fetched to avoid redirect race just after login.
    if (!profile) {
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      router.replace("/unauthorized");
    }
  }, [allowedRoles, hasAuthUser, loading, profile, router]);

  if (loading || (hasAuthUser && !profile) || !isAllowed) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
