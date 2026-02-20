"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { markNotificationAsRead } from "@/services/notification.service";
import type { AppNotification } from "@/types";

function formatNotificationTime(notification: AppNotification): string {
  if (!notification.createdAt) {
    return "just now";
  }

  return notification.createdAt.toDate().toLocaleString();
}

export function NotificationBell({
  currentUserId,
  notifications,
  mobileIconOnly = false,
}: {
  currentUserId: string;
  notifications: AppNotification[];
  mobileIconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.read || notification.recipientKey !== currentUserId) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      toast.error("Unable to mark notification as read.");
      console.warn("Mark notification read failed.", error);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative inline-flex min-h-[44px] items-center rounded-lg border border-sky-100 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 hover:bg-sky-50"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        {mobileIconOnly ? (
          <>
            <span className="inline-flex sm:hidden" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0h6Z" />
              </svg>
            </span>
            <span className="hidden sm:inline">Notifications</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </>
        )}
        {unreadCount > 0 ? (
          <span className="ml-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300 ease-in-out sm:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-xl bg-white shadow-lg transition-all duration-300 ease-in-out sm:hidden ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Alerts</p>
          <button
            type="button"
            aria-label="Close alerts"
            className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-lg px-3 text-slate-600 transition hover:bg-slate-100"
            onClick={() => setIsOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scroll-smooth p-2">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                className="mb-2 block min-h-[60px] w-full rounded-lg border border-slate-100 p-3 text-left text-sm leading-relaxed shadow-sm transition hover:bg-gray-100"
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatNotificationTime(notification)}
                    </p>
                  </div>

                  {!notification.read ? (
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-600" />
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 hidden w-80 max-w-none rounded-2xl border border-sky-100 bg-white/95 p-2 shadow-xl backdrop-blur-md sm:block">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Real-time Updates
          </p>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  className="block w-full rounded-lg border-b border-slate-100 p-3 text-left transition hover:bg-sky-50"
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatNotificationTime(notification)}
                      </p>
                    </div>

                    {!notification.read ? (
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-600" />
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
