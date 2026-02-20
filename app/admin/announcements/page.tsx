"use client";

import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const announcementSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(6, "Subject must be at least 6 characters.")
    .max(120, "Subject must be 120 characters or less."),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters.")
    .max(3000, "Message must be 3000 characters or less."),
});

const generationSchema = z.object({
  featureTitle: z
    .string()
    .trim()
    .min(3, "Feature title must be at least 3 characters.")
    .max(140, "Feature title must be 140 characters or less."),
  featureDescription: z
    .string()
    .trim()
    .min(10, "Feature description must be at least 10 characters.")
    .max(2000, "Feature description must be 2000 characters or less."),
});

const DEFAULT_BROADCAST_SUBJECT = "New Update from FoodBridge 🚀";
const DEFAULT_BROADCAST_MESSAGE = `Hello,

We’re excited to introduce a new feature
on the FoodBridge platform.

You can now schedule pickups
for food donations in advance,
making coordination between
restaurants and NGOs more efficient.

This feature helps reduce
last-minute delays and ensures
faster distribution of surplus food.

Stay connected with FoodBridge
to reduce food waste.

Regards,
FoodBridge Team`;

export default function AdminAnnouncementsPage() {
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [subject, setSubject] = useState(DEFAULT_BROADCAST_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_BROADCAST_MESSAGE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateEmail = async () => {
    setErrors((prev) => ({
      ...prev,
      featureTitle: "",
      featureDescription: "",
    }));

    const parsed = generationSchema.safeParse({ featureTitle, featureDescription });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        nextErrors[issue.path[0] as string] = issue.message;
      }

      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    try {
      setIsGenerating(true);

      const response = await fetch("/api/generateAnnouncementEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureTitle: parsed.data.featureTitle,
          featureDescription: parsed.data.featureDescription,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { subject?: string; body?: string; message?: string }
        | null;

      if (!response.ok || !payload?.subject || !payload?.body) {
        throw new Error(payload?.message ?? "Failed to generate announcement email.");
      }

      setSubject(payload.subject);
      setMessage(payload.body);
      toast.success("Email content generated.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate announcement email.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = announcementSchema.safeParse({ subject, message });

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

      const response = await fetch("/api/sendBroadcastEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: parsed.data.subject,
          message: parsed.data.message,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Failed to send update.");
      }

      toast.success("Emails sent successfully.");
      setSubject(DEFAULT_BROADCAST_SUBJECT);
      setMessage(DEFAULT_BROADCAST_MESSAGE);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send update.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardShell
        title="Admin Announcements"
        subtitle="Send platform updates to registered users via email."
        tone="admin"
      >
        <form className="surface-card space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-4">
            <Input
              label="Feature Title"
              value={featureTitle}
              onChange={(event) => setFeatureTitle(event.target.value)}
              error={errors.featureTitle}
              placeholder="e.g. Smart Pickup Scheduling"
              maxLength={140}
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Feature Description
              </span>
              <textarea
                className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.featureDescription ? "border-rose-400" : "border-slate-300"
                }`}
                rows={5}
                value={featureDescription}
                onChange={(event) => setFeatureDescription(event.target.value)}
                placeholder="Describe what is new and why users should care."
                maxLength={2000}
              />
              {errors.featureDescription ? (
                <span className="mt-1 block text-xs text-rose-600">{errors.featureDescription}</span>
              ) : null}
            </label>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={isGenerating}
                onClick={() => void handleGenerateEmail()}
              >
                {isGenerating ? "Generating..." : "Generate Email"}
              </Button>
            </div>
          </div>

          <Input
            label="Email Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            error={errors.subject}
            placeholder="Enter announcement subject"
            maxLength={120}
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Message</span>
            <textarea
              className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                errors.message ? "border-rose-400" : "border-slate-300"
              }`}
              rows={8}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write update for all users"
              maxLength={3000}
            />
            {errors.message ? (
              <span className="mt-1 block text-xs text-rose-600">{errors.message}</span>
            ) : null}
          </label>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {subject.length}/120 subject chars, {message.length}/3000 message chars
            </p>
            <Button type="submit" isLoading={isSubmitting}>
              Send Update
            </Button>
          </div>
        </form>
      </DashboardShell>
    </ProtectedRoute>
  );
}
