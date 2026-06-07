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
  featured?: boolean;
}

export function LuxuryFeatureCard({
  href,
  emoji,
  title,
  description,
  buttonLabel,
  gradient,
  delay = 0,
  featured = false,
}: LuxuryFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className={`group ${featured ? "sm:col-span-2" : ""}`}
    >
      <Link
        href={href}
        className={`block relative overflow-hidden rounded-[28px] luxury-glass border luxury-shadow transition-all duration-300 hover:border-champagne/30 hover:shadow-[0_12px_40px_rgba(201,169,98,0.18)] ${
          featured
            ? "border-champagne/25 min-h-[180px]"
            : "border-champagne/12"
        }`}
      >
        <div className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${gradient}`} />
        <div className="absolute top-3 right-4 text-xl opacity-20 select-none">✿</div>
        <div className="absolute bottom-3 left-4 text-base opacity-15 select-none">❀</div>

        <div className={`relative ${featured ? "p-6 sm:p-8" : "p-5 sm:p-6"}`}>
          <div className={`mb-4 drop-shadow-sm ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}>
            {emoji}
          </div>
          <h3 className={`font-serif font-semibold text-charcoal ${featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>
            {title}
          </h3>
          <p className={`text-warm-gray mt-1.5 leading-relaxed ${featured ? "text-base" : "text-sm"}`}>
            {description}
          </p>

          <span className={`inline-flex items-center gap-2 mt-5 rounded-full bg-gradient-to-r from-champagne to-champagne-light text-white font-medium shadow-md group-hover:shadow-lg group-hover:gap-3 transition-all ${
            featured ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm"
          }`}>
            {buttonLabel}
            <ArrowRight className={featured ? "w-5 h-5" : "w-4 h-4"} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
