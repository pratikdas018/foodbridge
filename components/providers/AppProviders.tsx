"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            border: "1px solid #cfe4ff",
            background: "#ffffff",
            color: "#1e293b",
          },
        }}
      />
    </AuthProvider>
  );
}
