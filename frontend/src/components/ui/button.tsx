import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "sm" | "md";
};

export function Button({ className, variant = "default", size = "md", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2";
  const variants =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300"
      : "bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:from-violet-600 hover:to-cyan-500 focus:ring-violet-300";
  return <button className={cn(base, sizes, variants, className)} {...props} />;
}
