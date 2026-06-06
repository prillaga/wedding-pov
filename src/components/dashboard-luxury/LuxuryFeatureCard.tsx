"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface LuxuryFeatureCardProps {
  href: string;
  emoji: string;
  title: string;
  description: string;
  buttonLabel: string;
  gradient: string;
  delay?: number;
}

export function LuxuryFeatureCard({
  href,
  emoji,
  title,
  description,
  buttonLabel,
  gradient,
  delay = 0,
}: LuxuryFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link
        href={href}
        className="block relative overflow-hidden rounded-[28px] luxury-glass border border-champagne/12 luxury-shadow transition-all duration-300 hover:border-champagne/30 hover:shadow-[0_12px_40px_rgba(201,169,98,0.18)]"
      >
        <div className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${gradient}`} />
        <div className="absolute top-2 right-3 text-lg opacity-20 select-none">✿</div>
        <div className="absolute bottom-2 left-3 text-sm opacity-15 select-none">❀</div>

        <div className="relative p-5 sm:p-6">
          <div className="text-3xl mb-4 drop-shadow-sm">{emoji}</div>
          <h3 className="font-serif text-xl font-semibold text-charcoal">{title}</h3>
          <p className="text-sm text-warm-gray mt-1.5 leading-relaxed">{description}</p>

          <span className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-gradient-to-r from-champagne to-champagne-light text-white text-sm font-medium shadow-md group-hover:shadow-lg group-hover:gap-3 transition-all">
            {buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
