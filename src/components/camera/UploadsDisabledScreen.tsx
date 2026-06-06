"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CameraOff } from "lucide-react";
import Link from "next/link";

interface UploadsDisabledScreenProps {
  onBack?: () => void;
}

export function UploadsDisabledScreen({ onBack }: UploadsDisabledScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center bg-charcoal"
    >
      <div className="max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-white/10">
          <CameraOff className="w-8 h-8 text-champagne" />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-2 text-ivory">Uploads Paused</h1>
        <p className="text-ivory/60 mb-8 leading-relaxed">
          Photo uploads are temporarily disabled for this event. Please enjoy the celebration.
        </p>
        {onBack && (
          <Button variant="gold" onClick={onBack} className="w-full">
            Back to Event
          </Button>
        )}
      </div>
    </motion.div>
  );
}
