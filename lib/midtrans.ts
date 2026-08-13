import midtransClient from "midtrans-client";

function isProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env — see .env.example.`);
  }
  return value;
}

export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction: isProduction(),
    serverKey: requireEnv("MIDTRANS_SERVER_KEY"),
    clientKey: requireEnv("MIDTRANS_CLIENT_KEY"),
  });
}

export function getCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction: isProduction(),
    serverKey: requireEnv("MIDTRANS_SERVER_KEY"),
    clientKey: requireEnv("MIDTRANS_CLIENT_KEY"),
  });
}

// Midtrans transaction_status + fraud_status -> our internal OrderStatus.
// Mirrors Midtrans's documented status transitions for Snap transactions.
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus: string | undefined,
): "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT" {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "PENDING_PAYMENT" : "PAID";
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING_PAYMENT";
    case "deny":
      return "FAILED";
    case "cancel":
      return "CANCELLED";
    case "expire":
      return "EXPIRED";
    case "refund":
    case "partial_refund":
      return "CANCELLED";
    default:
      return "PENDING_PAYMENT";
  }
}
