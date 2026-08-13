// midtrans-client ships no official TypeScript types. This is a minimal
// ambient declaration covering only what NgeStore uses (Snap + CoreApi).
declare module "midtrans-client" {
  export interface MidtransClientOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface SnapTransactionParameter {
    transaction_details: { order_id: string; gross_amount: number };
    item_details?: Array<{ id: string; price: number; quantity: number; name: string }>;
    customer_details?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
    callbacks?: { finish?: string };
    expiry?: { unit: "second" | "minute" | "hour" | "day"; duration: number };
  }

  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(options: MidtransClientOptions);
    createTransaction(parameter: SnapTransactionParameter): Promise<SnapTransactionResponse>;
  }

  export interface NotificationStatusResponse {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount: string;
    status_code: string;
    signature_key: string;
  }

  export class CoreApi {
    constructor(options: MidtransClientOptions);
    transaction: {
      notification(payload: unknown): Promise<NotificationStatusResponse>;
      status(orderId: string): Promise<NotificationStatusResponse>;
    };
  }

  const midtransClient: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default midtransClient;
}
