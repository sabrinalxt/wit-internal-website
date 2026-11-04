import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "primary" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "default", size = "md", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 ";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2";
  const variants = {
    default:
      "bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:from-violet-600 hover:to-cyan-500 focus:ring-violet-300",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
    // The site's lavender accent (#a0a0db), as on the login and signup buttons
    primary: "bg-purple-accent text-white focus:ring-violet-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300",
  }[variant];
  return <button className={cn(base, sizes, variants, className)} {...props} />;
}