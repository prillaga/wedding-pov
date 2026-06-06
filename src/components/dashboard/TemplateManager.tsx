"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { THEME_PRESETS } from "@/lib/constants";
import {
  applyTemplate,
  deleteTemplate,
  getTemplates,
  saveTemplate,
  updateTheme,
} from "@/lib/store";
import type { TemplateType, ThemePreset } from "@/types";
import { Bookmark, Trash2 } from "lucide-react";

interface TemplateManagerProps {
  eventId: string;
  onRefresh: () => void;
}

export function TemplateManager({ eventId, onRefresh }: TemplateManagerProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("full");
  const [templates, setTemplates] = useState(getTemplates());

  const reload = () => {
    setTemplates(getTemplates());
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Quick Apply Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                updateTheme(eventId, {
                  preset,
                  colors: THEME_PRESETS[preset].colors,
                });
                onRefresh();
              }}
              className="p-3 rounded-xl border border-champagne/20 text-left text-xs hover:bg-blush transition-colors"
            >
              {THEME_PRESETS[preset].label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateTheme(eventId, { preset: "custom" })}
            className="p-3 rounded-xl border border-dashed border-champagne/30 text-left text-xs text-warm-gray"
          >
            Custom Theme
          </button>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Save As Template</h3>
        <Input
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Classic White & Gold"
        />
        <Select
          label="Save Type"
          options={[
            { value: "full", label: "Full Theme + Limits" },
            { value: "theme", label: "Theme Preset" },
            { value: "colors", label: "Color Preset" },
            { value: "backgrounds", label: "Background Preset" },
            { value: "limits", label: "Photo Limit Preset" },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as TemplateType)}
        />
        <Button
          variant="gold"
          size="sm"
          disabled={!name.trim()}
          onClick={() => {
            saveTemplate(eventId, name.trim(), type);
            setName("");
            reload();
          }}
        >
          <Bookmark className="w-4 h-4" /> Save Template
        </Button>
      </section>

      {templates.length > 0 && (
        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
          <h3 className="font-medium mb-3">Saved Templates</h3>
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-blush/30 border border-champagne/10"
              >
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-[10px] text-warm-gray capitalize">{t.type} preset</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      applyTemplate(eventId, t.id);
                      reload();
                    }}
                  >
                    Apply
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTemplate(t.id);
                      reload();
                    }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
