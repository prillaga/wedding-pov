"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CameraSuccessToastProps {
  message: string;
}

export function CameraSuccessToast({ message }: CameraSuccessToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-20 left-4 right-4 z-30 flex items-center justify-center pointer-events-none"
    >
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-charcoal/90 border border-champagne/30 backdrop-blur-md shadow-lg">
        <CheckCircle2 className="w-5 h-5 text-champagne shrink-0" />
        <p className="text-sm text-ivory font-medium">{message}</p>
      </div>
    </motion.div>
  );
}
