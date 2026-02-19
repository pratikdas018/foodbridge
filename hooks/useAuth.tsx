"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { AppUser, NgoAvailabilityStatus, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeAvailabilityStatus(value: unknown): NgoAvailabilityStatus {
  if (value === "busy") {
    return "busy";
  }

  return "available";
}

async function fetchUserProfile(userId: string): Promise<AppUser | null> {
  const db = getClientDb();
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();

  return {
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    isVerified: Boolean(data.isVerified),
    availabilityStatus: normalizeAvailabilityStatus(data.availabilityStatus),
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const auth = getClientAuth();

    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    setLoading(true);

    try {
      const nextProfile = await fetchUserProfile(auth.currentUser.uid);
      setProfile(nextProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getClientAuth();

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await fetchUserProfile(nextUser.uid);
        setProfile(nextProfile);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
