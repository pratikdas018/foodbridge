"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  deleteUserAction,
  setNgoVerificationAction,
  updateUserRoleAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { AppUser, UserRole } from "@/types";

const roleOptions: UserRole[] = ["restaurant", "ngo", "admin"];

export function UsersTable({
  users,
  currentAdminUid,
}: {
  users: AppUser[];
  currentAdminUid: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const handleRoleUpdate = (userId: string, role: UserRole) => {
    setActiveUserId(userId);

    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActiveUserId(null);
    });
  };

  const handleDeleteUser = (userId: string) => {
    setActiveUserId(userId);

    startTransition(async () => {
      const result = await deleteUserAction(userId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActiveUserId(null);
    });
  };

  const handleNgoVerification = (userId: string, isVerified: boolean) => {
    setActiveUserId(userId);

    startTransition(async () => {
      const result = await setNgoVerificationAction(userId, isVerified);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActiveUserId(null);
    });
  };

  return (
    <div className="table-shell animate-fade-rise">
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
          All Users
        </h2>
      </div>

      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">NGO Verification</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Joined</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const rowIsBusy = isPending && activeUserId === user.uid;
              const isCurrentAdmin = currentAdminUid === user.uid;

              return (
                <tr key={user.uid}>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="fancy-select capitalize"
                      defaultValue={user.role}
                      disabled={rowIsBusy}
                      onChange={(event) =>
                        handleRoleUpdate(user.uid, event.target.value as UserRole)
                      }
                    >
                      {roleOptions.map((option) => (
                        <option className="capitalize" key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "ngo" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            user.isVerified
                              ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
                              : "inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800"
                          }
                        >
                          {user.isVerified ? "Verified" : "Not Verified"}
                        </span>
                        <Button
                          className="px-3 py-1.5 text-xs"
                          disabled={rowIsBusy || user.isVerified}
                          onClick={() => handleNgoVerification(user.uid, true)}
                          variant="secondary"
                        >
                          Verify
                        </Button>
                        <Button
                          className="px-3 py-1.5 text-xs"
                          disabled={rowIsBusy || !user.isVerified}
                          onClick={() => handleNgoVerification(user.uid, false)}
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.createdAt?.toDate().toLocaleString() ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      disabled={rowIsBusy || isCurrentAdmin}
                      onClick={() => handleDeleteUser(user.uid)}
                    >
                      {isCurrentAdmin ? "Current Admin" : "Delete User"}
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
