"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    emoji: "📸",
    title: "Take Photos",
    description: "Capture your unique perspective.",
  },
  {
    emoji: "🖼",
    title: "View Gallery",
    description: "See moments shared by every guest.",
  },
  {
    emoji: "🎞",
    title: "Watch Slideshow",
    description: "Relive the wedding story in real time.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-serif text-xl text-charcoal">How It Works</h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-champagne">Simple &amp; Fast</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="luxury-glass rounded-[24px] border border-champagne/10 p-5 text-center luxury-shadow"
          >
            <div className="text-3xl mb-3">{step.emoji}</div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{step.title}</h3>
            <p className="text-sm text-warm-gray mt-1.5 leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
