import { PrintCenterClient } from "@/components/print-center/PrintCenterClient";

export const metadata = {
  title: "Instant Print Center | Prillaga & Co.",
  description: "Print guest photos instantly with Xiaomi Portable Photo Printer",
};

export default function PrintCenterPage() {
  return <PrintCenterClient />;
}
