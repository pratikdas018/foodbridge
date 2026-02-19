"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { getDashboardPath, registerUser } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { RegisterPayload } from "@/types";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Confirm your password."),
    role: z.enum(["restaurant", "ngo"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { loading, profile, refreshProfile, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "restaurant" as RegisterPayload["role"],
  });

  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(getDashboardPath(profile.role));
    }
  }, [loading, profile, router, user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse(formData);

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

      const role = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      void refreshProfile();
      toast.success("Account created successfully.");
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
      <aside className="surface-card hidden bg-gradient-to-br from-fuchsia-700 via-violet-700 to-cyan-700 p-8 text-white md:block">
        <p className="section-kicker text-white/80">Join FoodBridge</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-sora)" }}>
          Start Turning Surplus Into Support.
        </h1>
        <p className="mt-4 text-sm text-white/90">
          Register as a restaurant or NGO and coordinate verified food donations in real time.
        </p>
      </aside>

      <form className="surface-card space-y-4" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
          Create Account
        </h1>

        <Input
          label="Full Name"
          value={formData.name}
          onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          error={errors.name}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
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

        <Input
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))
          }
          error={errors.confirmPassword}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Role</span>
          <select
            className="fancy-select w-full"
            value={formData.role}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                role: event.target.value as RegisterPayload["role"],
              }))
            }
          >
            <option value="restaurant">Restaurant</option>
            <option value="ngo">NGO</option>
          </select>
        </label>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Register
        </Button>

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}
