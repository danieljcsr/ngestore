import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/types";
import { OrderStatusView, type OrderStatusViewData } from "./OrderStatusView";

export default async function OrderPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;

  const order = await prisma.order.findUnique({
    where: { orderCode: code },
  });

  if (!order) {
    return (
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">Pesanan Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted">
            Kode pesanan <span className="font-mono text-foreground/90">{code}</span> tidak
            kami temukan. Pastikan kode yang kamu masukkan sudah benar.
          </p>
          <div className="mt-6">
            <Button href="/track" size="lg">
              Kembali ke Lacak Pesanan
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const data: OrderStatusViewData = {
    orderCode: order.orderCode,
    gameName: order.gameName,
    denominationName: order.denominationName,
    amount: order.amount,
    playerId: order.playerId,
    zoneId: order.zoneId,
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
  };

  return <OrderStatusView order={data} />;
}
