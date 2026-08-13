"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-full"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Keluar..." : "Keluar"}
    </Button>
  );
}
