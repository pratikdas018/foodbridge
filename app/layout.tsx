import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { RootFrame } from "@/components/layout/RootFrame";
import { AppProviders } from "@/components/providers/AppProviders";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const manrope = Manrope({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "FoodBridge - Food Waste Donation Platform",
  description:
    "Connect restaurants with surplus food to NGOs that distribute meals to people in need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable} ${manrope.className}`}>
        <AppProviders>
          <RootFrame>{children}</RootFrame>
        </AppProviders>
      </body>
    </html>
  );
}
