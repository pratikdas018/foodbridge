import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ className, error, label, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={clsx(
          "w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-sm outline-none transition",
          "focus:border-sky-500 focus:ring-2 focus:ring-sky-100",
          error ? "border-rose-400" : "border-slate-300",
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
