"use client";

import { AdminGate } from "@/components/admin/AdminGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
