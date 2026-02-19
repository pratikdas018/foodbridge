"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { getFirebaseStorageErrorMessage } from "@/lib/firebase/storage-errors";
import { addDonation } from "@/services/donation.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationPickerMap } from "@/components/ui/LocationPickerMap";

const donationSchema = z.object({
  foodName: z.string().min(2, "Food name is required."),
  quantity: z.string().min(1, "Quantity is required."),
  address: z.string().min(5, "Pickup address is required."),
  availableTill: z.string().min(1, "Availability end time is required."),
  description: z.string().min(10, "Description should be at least 10 characters."),
});

interface FormState {
  foodName: string;
  quantity: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  availableTill: string;
  description: string;
}

const initialState: FormState = {
  foodName: "",
  quantity: "",
  address: "",
  latitude: null,
  longitude: null,
  availableTill: "",
  description: "",
};

export function AddDonationForm({ restaurantId }: { restaurantId: string }) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    uploadKind: "image" | "video";
    percentage: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = donationSchema.safeParse(formState);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        nextErrors[issue.path[0] as string] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

    if (new Date(formState.availableTill) <= new Date()) {
      setErrors({ availableTill: "Choose a future date and time." });
      return;
    }

    if (formState.latitude === null || formState.longitude === null) {
      setErrors({ location: "Select pickup location from map." });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadStatus(null);

      await addDonation(
        restaurantId,
        {
          ...formState,
          latitude: formState.latitude,
          longitude: formState.longitude,
          imageFile,
          videoFile,
        },
        {
          onMediaUploadProgress: (payload) => setUploadStatus(payload),
        },
      );

      toast.success("Donation created.");
      setFormState(initialState);
      setImageFile(null);
      setVideoFile(null);
      setUploadStatus(null);
    } catch (error) {
      toast.error(getFirebaseStorageErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="surface-card space-y-4 animate-fade-rise" onSubmit={onSubmit}>
      <p className="section-kicker">Restaurant Actions</p>
      <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
        Add Food Donation
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Food Name"
          value={formState.foodName}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, foodName: event.target.value }))
          }
          error={errors.foodName}
          placeholder="Rice and curry"
        />

        <Input
          label="Quantity"
          value={formState.quantity}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, quantity: event.target.value }))
          }
          error={errors.quantity}
          placeholder="50 meal packs"
        />
      </div>

      <Input
        label="Pickup Address"
        value={formState.address}
        onChange={(event) =>
          setFormState((prev) => ({
            ...prev,
            address: event.target.value,
            latitude: null,
            longitude: null,
          }))
        }
        error={errors.address}
        placeholder="123 Main St, New York"
      />

      <LocationPickerMap
        selectedLatitude={formState.latitude}
        selectedLongitude={formState.longitude}
        onLocationSelect={({ address, latitude, longitude }) => {
          setFormState((prev) => ({
            ...prev,
            address,
            latitude,
            longitude,
          }));
          setErrors((prev) => ({
            ...prev,
            location: "",
            address: "",
          }));
        }}
      />
      {formState.latitude !== null && formState.longitude !== null ? (
        <p className="text-xs text-slate-600">
          Selected: {formState.latitude.toFixed(6)}, {formState.longitude.toFixed(6)}
        </p>
      ) : null}
      {errors.location ? (
        <p className="text-xs text-rose-600">{errors.location}</p>
      ) : null}

      <Input
        label="Available Till"
        type="datetime-local"
        value={formState.availableTill}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, availableTill: event.target.value }))
        }
        error={errors.availableTill}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Food Image</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-700"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              if (file && !file.type.startsWith("image/")) {
                toast.error("Please select a valid image file.");
                setImageFile(null);
                return;
              }

              if (file && file.size > 8 * 1024 * 1024) {
                toast.error("Image size should be under 8MB.");
                setImageFile(null);
                return;
              }

              setImageFile(file);
              setUploadStatus(null);
            }}
          />
          <p className="mt-1 text-xs text-slate-500">Optional. JPG/PNG/WebP up to 8MB.</p>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Food Video</span>
          <input
            type="file"
            accept="video/*"
            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              if (file && !file.type.startsWith("video/")) {
                toast.error("Please select a valid video file.");
                setVideoFile(null);
                return;
              }

              if (file && file.size > 40 * 1024 * 1024) {
                toast.error("Video size should be under 40MB.");
                setVideoFile(null);
                return;
              }

              setVideoFile(file);
              setUploadStatus(null);
            }}
          />
          <p className="mt-1 text-xs text-slate-500">Optional. MP4/WebM up to 40MB.</p>
        </label>
      </div>

      {uploadStatus !== null ? (
        <div className="space-y-1 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <div className="h-2 w-full rounded-full bg-slate-200/70">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 transition-all"
              style={{ width: `${uploadStatus.percentage}%` }}
            />
          </div>
          <p className="text-xs font-medium text-slate-600">
            Uploading {uploadStatus.uploadKind}: {uploadStatus.percentage}%
          </p>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
        <textarea
          className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          rows={4}
          value={formState.description}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, description: event.target.value }))
          }
          placeholder="Freshly prepared and safely stored food available for pickup."
        />
        {errors.description ? (
          <span className="mt-1 block text-xs text-rose-600">{errors.description}</span>
        ) : null}
      </label>

      <Button type="submit" isLoading={isSubmitting}>
        Create Donation
      </Button>
    </form>
  );
}
