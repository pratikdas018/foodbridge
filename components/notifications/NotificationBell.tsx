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
}: {
  currentUserId: string;
  notifications: AppNotification[];
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
        className="relative inline-flex items-center rounded-xl border border-sky-100 bg-white/90 px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-sky-50 sm:px-3"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <span className="hidden sm:inline">Notifications</span>
        <span className="sm:hidden">Alerts</span>
        {unreadCount > 0 ? (
          <span className="ml-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-sky-100 bg-white/95 p-2 shadow-xl backdrop-blur-md">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Real-time Updates
          </p>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  className="block w-full rounded-xl px-2 py-2 text-left transition hover:bg-sky-50"
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
