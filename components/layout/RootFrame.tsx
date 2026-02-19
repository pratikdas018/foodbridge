"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function RootFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoleWorkspace = pathname.startsWith("/ngo") || pathname.startsWith("/restaurant");

  if (isRoleWorkspace) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </>
  );
}
