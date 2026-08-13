"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/order/${encodeURIComponent(trimmed)}`);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Lacak Pesanan</h1>
        <p className="mt-2 text-sm text-muted">
          Masukkan kode pesanan kamu untuk melihat status top up. Kode pesanan dikirim
          setelah checkout, formatnya seperti{" "}
          <span className="font-mono text-foreground/90">NGS-20260813-7F3K9A</span>.
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="order-code">Kode Pesanan</Label>
              <Input
                id="order-code"
                name="orderCode"
                placeholder="NGS-20260813-7F3K9A"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                required
              />
            </div>
            <Button type="submit" size="lg">
              Lacak Pesanan
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
