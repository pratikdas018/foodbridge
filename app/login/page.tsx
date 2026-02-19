"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { getDashboardPath, loginUser } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function LoginPage() {
  const router = useRouter();
  const { loading, profile, refreshProfile, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(getDashboardPath(profile.role));
    }
  }, [loading, profile, router, user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse(formData);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        nextErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const role = await loginUser(formData);
      void refreshProfile();
      toast.success("Login successful.");
      const dashboardPath = getDashboardPath(role);

      if (typeof window !== "undefined") {
        window.location.assign(dashboardPath);
        return;
      }

      router.replace(dashboardPath);
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[1.1fr_1fr]">
      <aside className="surface-card hidden bg-gradient-to-br from-sky-700 via-cyan-700 to-emerald-600 p-8 text-white md:block">
        <p className="section-kicker text-white/80">Welcome Back</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-sora)" }}>
          Continue Your Food Rescue Mission.
        </h1>
        <p className="mt-4 text-sm text-white/90">
          Access real-time donation coordination, live notifications, and role-based dashboards.
        </p>
      </aside>

      <form className="surface-card space-y-4" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
          Login
        </h1>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, email: event.target.value }))
          }
          error={errors.email}
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, password: event.target.value }))
          }
          error={errors.password}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Login
        </Button>

        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-sky-700 hover:text-sky-800">
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}
