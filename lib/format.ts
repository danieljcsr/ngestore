const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}
