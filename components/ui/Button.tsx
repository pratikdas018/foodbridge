import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 text-white shadow-[0_8px_24px_rgba(9,102,180,0.25)] hover:from-sky-700 hover:via-cyan-700 hover:to-emerald-600 focus-visible:outline-sky-500",
  secondary:
    "bg-white/90 text-slate-800 border border-sky-100 shadow-sm hover:bg-sky-50 focus-visible:outline-sky-400",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_8px_20px_rgba(225,29,72,0.2)] hover:from-rose-700 hover:to-red-600 focus-visible:outline-rose-500",
  ghost:
    "bg-transparent text-slate-700 hover:bg-white/80 focus-visible:outline-slate-400",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

export function Button({
  children,
  className,
  disabled,
  isLoading,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClassMap[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
