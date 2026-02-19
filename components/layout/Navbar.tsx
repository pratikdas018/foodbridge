"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath, logoutUser } from "@/services/auth.service";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";
import { subscribeNotifications } from "@/services/notification.service";
import { playNotificationSound } from "@/lib/notification-sound";
import type { AppNotification } from "@/types";

export function Navbar() {
  const router = useRouter();
  const { loading, profile, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsHydrated, setNotificationsHydrated] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const initializedNotificationsRef = useRef(false);

  useEffect(() => {
    if (!user || !profile) {
      setNotifications([]);
      setNotificationsHydrated(false);
      seenNotificationIdsRef.current = new Set();
      initializedNotificationsRef.current = false;
      return;
    }

    const unsubscribe = subscribeNotifications(
      user.uid,
      (nextNotifications) => {
        setNotifications(nextNotifications);
        setNotificationsHydrated(true);
      },
      (error) => {
        setNotificationsHydrated(true);
        toast.error("Unable to load notifications.");
        console.warn("Notification subscription error.", error);
      },
    );
    return unsubscribe;
  }, [profile, user]);

  useEffect(() => {
    if (!user || !profile || !notificationsHydrated) {
      return;
    }

    if (!initializedNotificationsRef.current) {
      seenNotificationIdsRef.current = new Set(notifications.map((item) => item.id));
      initializedNotificationsRef.current = true;
      return;
    }

    const unseen = notifications.filter(
      (notification) => !seenNotificationIdsRef.current.has(notification.id),
    );

    if (unseen.length > 0) {
      for (const notification of unseen) {
        seenNotificationIdsRef.current.add(notification.id);
      }

      const first = unseen[0];
      toast.success(first.title);
      playNotificationSound().catch(() => undefined);
    }
  }, [notifications, notificationsHydrated, profile, user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully.");
      router.replace("/login");
    } catch {
      toast.error("Unable to logout right now.");
    }
  };

  const dashboardPath = profile ? getDashboardPath(profile.role) : null;
  const roleLabel = profile?.role ? profile.role.toUpperCase() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 text-sm font-bold text-white shadow-sm">
            FB
          </span>
          <span
            className="text-xl font-bold gradient-title"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            FoodBridge
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
            href="/"
          >
            Home
          </Link>

          {!loading && user && dashboardPath ? (
            <>
              <NotificationBell currentUserId={user.uid} notifications={notifications} />
              {roleLabel ? (
                <span className="hidden rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-sky-700 sm:inline-block">
                  {roleLabel}
                </span>
              ) : null}
              <Link
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
                href={dashboardPath}
              >
                Dashboard
              </Link>
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            </>
          ) : null}

          {!loading && !user ? (
            <>
              <Link
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
                href="/register"
              >
                Register
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
