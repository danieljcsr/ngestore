import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "indigo" | "cyan" | "amber" | "success";
}) {
  const accentClasses: Record<typeof accent, string> = {
    indigo: "bg-brand-indigo/15 text-brand-indigo",
    cyan: "bg-brand-cyan/15 text-brand-cyan",
    amber: "bg-brand-amber/15 text-brand-amber",
    success: "bg-success/15 text-success",
  };

  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </Card>
  );
}
