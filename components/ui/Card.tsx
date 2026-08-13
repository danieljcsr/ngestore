import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card-surface rounded-2xl", className)}>{children}</div>;
}
