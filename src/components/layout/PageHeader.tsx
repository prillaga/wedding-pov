"use client";

import { motion } from "framer-motion";
import { cn, toPossessive } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 sm:px-5 pt-4 sm:pt-6 pb-4 safe-top safe-x">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl font-semibold break-words">{title}</h1>
          {subtitle && <p className="text-warm-gray text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </motion.header>
  );
}

export function POVBadge({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xs", md: "text-sm", lg: "text-lg" };
  return (
    <span className={cn("font-serif font-semibold", sizes[size])}>
      {toPossessive(name)}{" "}
      <span className="text-champagne font-sans font-medium">POV</span>
    </span>
  );
}
