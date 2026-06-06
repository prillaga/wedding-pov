"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Camera, Clapperboard, Grid3X3, Home, User } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/event/${eventId}`;
  const items = [
    { href: base, label: "Home", icon: Home },
    { href: `${base}/camera`, label: "Camera", icon: Camera },
    { href: `${base}/gallery`, label: "Gallery", icon: Grid3X3 },
    { href: `${base}/slideshow`, label: "Slideshow", icon: Clapperboard },
    { href: `${base}/my-uploads`, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-2 sm:bottom-4 inset-x-2 sm:inset-x-4 z-50 safe-bottom safe-x pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="luxury-glass rounded-[22px] sm:rounded-[28px] border border-champagne/20 luxury-shadow px-1 sm:px-2 py-1.5 sm:py-2">
          <div className="flex items-stretch justify-between gap-0.5">
            {items.map((item) => {
              const active =
                item.href === base
                  ? pathname === base
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 sm:px-2 py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-medium transition-colors min-w-0 touch-target",
                    active ? "text-champagne" : "text-warm-gray hover:text-charcoal"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl sm:rounded-2xl bg-champagne/10 border border-champagne/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("w-[18px] h-[18px] sm:w-5 sm:h-5 relative z-10 shrink-0", active && "drop-shadow-sm")} />
                  <span className="relative z-10 truncate max-w-full leading-none">{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-champagne" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
