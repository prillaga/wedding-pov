"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { APP_NAME, STUDIO_NAME, TAGLINE } from "@/lib/constants";
import { Check, Heart, Sparkles } from "lucide-react";

const PLANS: {
  name: string;
  price: string;
  badge?: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
}[] = [
  {
    name: "Essential",
    price: "₱1,999",
    description: "Best for intimate weddings.",
    features: [
      "QR Code Access",
      "Wedding Theme Customization",
      "Live Gallery",
      "Live Slideshow",
      "Reception Display Mode",
      "Download All Photos",
      "Up to 5 uploads per guest",
    ],
    cta: "Get Essential",
    highlight: false,
  },
  {
    name: "Premium",
    price: "₱2,999",
    badge: "Most Popular",
    description: "Perfect for most weddings.",
    features: [
      "Everything in Essential",
      "Advanced Theme Customization",
      "Custom Colors & Backgrounds",
      "Guest Photo Management",
      "Reception TV Display Mode",
      "Up to 10 uploads per guest",
    ],
    cta: "Get Premium",
    highlight: true,
  },
  {
    name: "Luxury",
    price: "₱4,999",
    description: "Perfect for larger weddings and events.",
    features: [
      "Everything in Premium",
      "Full Admin Customization",
      "Unlimited Theme Changes",
      "Premium Slideshow Effects",
      "Priority Support",
      "Up to 20 uploads per guest",
    ],
    cta: "Get Luxury",
    highlight: false,
  },
] as const;

const ADDON = {
  name: "Unlimited Uploads Per Guest",
  price: "₱2,000",
  description:
    "Remove upload limits and allow guests to upload unlimited wedding memories throughout the event.",
};

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-ivory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 safe-top safe-bottom">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-1 text-champagne text-sm mb-4">
            <span className="inline-flex items-center gap-2">
              <Heart className="w-4 h-4 fill-champagne/30" />
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-warm-gray">by {STUDIO_NAME}</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal">Pricing</h1>
          <p className="text-warm-gray mt-3">{TAGLINE}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-3xl p-6 border wedding-shadow ${
                plan.highlight
                  ? "border-champagne bg-gradient-to-b from-blush to-white ring-2 ring-champagne/30"
                  : "border-champagne/15 bg-white"
              }`}
            >
              {plan.badge && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-champagne mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> {plan.badge}
                </span>
              )}
              <h2 className="font-serif text-2xl font-semibold text-charcoal">{plan.name}</h2>
              <p className="text-3xl font-semibold text-charcoal mt-2">{plan.price}</p>
              <p className="text-sm text-warm-gray mt-2 mb-5">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-charcoal">
                    <Check className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/create">
                <Button variant={plan.highlight ? "gold" : "secondary"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 max-w-2xl mx-auto rounded-3xl border border-champagne/15 bg-white p-6 wedding-shadow text-center">
          <p className="text-xs uppercase tracking-wider text-warm-gray">Optional Add-On</p>
          <h3 className="font-serif text-xl font-semibold text-charcoal mt-2">{ADDON.name}</h3>
          <p className="text-2xl font-semibold text-champagne mt-1">{ADDON.price}</p>
          <p className="text-sm text-warm-gray mt-3">{ADDON.description}</p>
        </div>

        <div className="text-center mt-10">
          <Link href="/dashboard" className="text-sm text-champagne hover:underline">
            Admin Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
