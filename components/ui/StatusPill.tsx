import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-warning/15 text-warning border-warning/30",
  PAID: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
  PROCESSING: "bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30",
  COMPLETED: "bg-success/15 text-success border-success/30",
  FAILED: "bg-danger/15 text-danger border-danger/30",
  EXPIRED: "bg-muted/15 text-muted border-muted/30",
  CANCELLED: "bg-muted/15 text-muted border-muted/30",
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
