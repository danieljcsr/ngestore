import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted",
        "outline-none transition focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/30",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-foreground/90", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted",
        "outline-none transition focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/30",
        className,
      )}
      {...props}
    />
  );
}
