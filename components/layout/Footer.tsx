"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/services/auth.service";

function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001A2.5 2.5 0 0 0 4.98 3.5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.53-1 1.83-2.1 3.77-2.1 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94V21h-4V9Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.89 1.56 2.34 1.11 2.9.84.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.02 1.63 1.02 2.75 0 3.95-2.33 4.82-4.56 5.07.36.32.67.95.67 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.2l-4.86-6.35L6.38 22H3.27l7.23-8.27L1 2h6.35l4.4 5.82L18.9 2Zm-1.09 18h1.72L6.41 3.9H4.56L17.81 20Z" />
    </svg>
  );
}

export function Footer() {
  const { profile } = useAuth();
  const dashboardLink = profile ? getDashboardPath(profile.role) : "/login";

  return (
    <footer className="mt-16 bg-gray-900 text-gray-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-bold text-white">
                FB
              </span>
              <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>
                FoodBridge
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              FoodBridge connects restaurants with NGOs to reduce food waste and deliver surplus
              meals to people in need.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="transition-all duration-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href={dashboardLink} className="transition-all duration-300 hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/restaurant/actions" className="transition-all duration-300 hover:text-white">
                  Donate Food
                </Link>
              </li>
              <li>
                <Link href="/ngo/dashboard" className="transition-all duration-300 hover:text-white">
                  NGO Panel
                </Link>
              </li>
              <li>
                <Link href="/restaurant/dashboard" className="transition-all duration-300 hover:text-white">
                  Restaurant Panel
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="transition-all duration-300 hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="transition-all duration-300 hover:text-white">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-all duration-300 hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition-all duration-300 hover:text-white">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>
                <span className="font-medium text-gray-300">Email: </span>
                support@foodbridge.org
              </li>
              <li>
                <span className="font-medium text-gray-300">Phone: </span>
                +91 98765 43210
              </li>
              <li>
                <span className="font-medium text-gray-300">Location: </span>
                Kolkata, India
              </li>
              <li>
                <span className="font-medium text-gray-300">Portfolio: </span>
                <a
                  href="https://pratik-web.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all duration-300 hover:text-white"
                >
                  pratik-web.vercel.app
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 border-t border-gray-700" />

        <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row">
          <p className="text-sm text-gray-400">(c) 2026 FoodBridge. All rights reserved.</p>

          <div className="flex items-center gap-4 text-gray-300">
            <a
              href="https://www.linkedin.com/in/pratik018/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition-all duration-300 hover:scale-110 hover:text-white"
            >
              <LinkedInIcon />
            </a>
            <a
              href="https://github.com/pratikdas018"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="transition-all duration-300 hover:scale-110 hover:text-white"
            >
              <GitHubIcon />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="transition-all duration-300 hover:scale-110 hover:text-white"
            >
              <TwitterIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
