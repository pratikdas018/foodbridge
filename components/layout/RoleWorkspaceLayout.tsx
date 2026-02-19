"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { playNotificationSound } from "@/lib/notification-sound";
import { logoutUser } from "@/services/auth.service";
import { subscribeNotifications } from "@/services/notification.service";
import type { AppNotification } from "@/types";

export type WorkspaceRole = "ngo" | "restaurant";
export type WorkspaceIcon =
  | "dashboard"
  | "profile"
  | "availability"
  | "claims"
  | "receipts"
  | "donations"
  | "schedules"
  | "actions";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: WorkspaceIcon;
}

function Icon({ icon }: { icon: WorkspaceIcon }) {
  const baseClass = "h-5 w-5";

  switch (icon) {
    case "dashboard":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M4 12h6V4H4zm10 8h6v-8h-6zM4 20h6v-4H4zm10-10h6V4h-6z" />
        </svg>
      );
    case "profile":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" />
        </svg>
      );
    case "availability":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M8 12.5 11 16l5-8" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "claims":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M8 7h8M8 12h8M8 17h5" />
          <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "receipts":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3Z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case "donations":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 3c3.5 0 6 2.7 6 6s-2.5 8-6 12C8.5 17 6 12.5 6 9s2.5-6 6-6Z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      );
    case "schedules":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case "actions":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    default:
      return null;
  }
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const label = role === "ngo" ? "NGO" : "RESTAURANT";

  return (
    <span className="hidden rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm md:inline-flex">
      {label}
    </span>
  );
}

function RouteContentAnimator({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {children}
    </div>
  );
}

export function RoleWorkspaceLayout({
  role,
  navItems,
  children,
}: {
  role: WorkspaceRole;
  navItems: WorkspaceNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsHydrated, setNotificationsHydrated] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const initializedNotificationsRef = useRef(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [navItems, router]);

  useEffect(() => {
    if (!user) {
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
      () => {
        setNotificationsHydrated(true);
        toast.error("Unable to load notifications.");
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !notificationsHydrated) {
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

      toast.success(unseen[0].title);
      void playNotificationSound().catch(() => undefined);
    }
  }, [notifications, notificationsHydrated, user]);

  const workspaceTitle = useMemo(() => {
    return role === "ngo" ? "NGO Workspace" : "Restaurant Workspace";
  }, [role]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully.");
      router.replace("/login");
    } catch {
      toast.error("Unable to logout right now.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sky-100/80 bg-white/85 p-6 shadow-xl backdrop-blur-xl md:block">
        <Link className="inline-flex items-center gap-3" href="/">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-white shadow-sm">
            FB
          </span>
          <div>
            <p className="text-lg font-bold gradient-title" style={{ fontFamily: "var(--font-sora)" }}>
              FoodBridge
            </p>
            <p className="text-xs text-slate-500">{workspaceTitle}</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out ${
                  isActive
                    ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-md"
                    : "text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                }`}
              >
                <Icon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-sky-100/80 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                aria-label="Open sidebar"
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50 md:hidden"
                onClick={() => setIsMobileOpen(true)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Dashboard</p>
                <p className="text-sm font-semibold text-slate-800">{profile?.name ?? workspaceTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {user ? <NotificationBell currentUserId={user.uid} notifications={notifications} /> : null}
              <RoleBadge role={role} />
              <Link
                href="/"
                className="rounded-xl border border-sky-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
              >
                Home
              </Link>
              <button
                onClick={() => void handleLogout()}
                type="button"
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-10">
          <RouteContentAnimator key={pathname}>{children}</RouteContentAnimator>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-all duration-300 ease-in-out md:hidden ${
          isMobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-sky-100 bg-white p-6 shadow-2xl transition-all duration-300 ease-in-out md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link className="inline-flex items-center gap-2" href="/">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-xs font-bold text-white">
              FB
            </span>
            <span className="text-base font-bold gradient-title" style={{ fontFamily: "var(--font-sora)" }}>
              FoodBridge
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-300 ease-in-out hover:bg-slate-100"
            onClick={() => setIsMobileOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out ${
                  isActive
                    ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white"
                    : "text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                }`}
              >
                <Icon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
