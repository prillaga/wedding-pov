"use client";

import { cn } from "@/lib/utils";

export function Input({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-warm-gray mb-1.5">{label}</label>}
      <input className={cn("w-full px-4 py-3 rounded-2xl border border-champagne/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-champagne/40", className)} {...props} />
    </div>
  );
}

export function Textarea({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-warm-gray mb-1.5">{label}</label>}
      <textarea className={cn("w-full px-4 py-3 rounded-2xl border border-champagne/20 bg-white/80 resize-none focus:outline-none focus:ring-2 focus:ring-champagne/40", className)} {...props} />
    </div>
  );
}

export function Select({ label, options, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-warm-gray mb-1.5">{label}</label>}
      <select className={cn("w-full px-4 py-3 rounded-2xl border border-champagne/20 bg-white/80", className)} {...props}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}
