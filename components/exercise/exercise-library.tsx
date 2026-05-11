"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExerciseLibraryTemplate = {
  id: string;
  name: string;
  description: string | null;
  body_region?: string | null;
  recovery_phase?: string | null;
  goal?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  video_url: string | null;
};

type ExerciseLibraryProps = {
  templates: ExerciseLibraryTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onQueueVideo: (template: ExerciseLibraryTemplate) => void;
  queueingVideoForTemplateId: string | null;
  getVideoStatus: (templateId: string) => string;
  getVideoUrl: (template: ExerciseLibraryTemplate) => string | null;
};

const filterConfig = [
  { key: "body_region", label: "Region" },
  { key: "recovery_phase", label: "Phase" },
  { key: "goal", label: "Goal" },
  { key: "equipment", label: "Equipment" },
  { key: "difficulty", label: "Difficulty" },
] as const;

export function ExerciseLibrary({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onQueueVideo,
  queueingVideoForTemplateId,
  getVideoStatus,
  getVideoUrl,
}: ExerciseLibraryProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterOptions = useMemo(() => {
    return Object.fromEntries(
      filterConfig.map((config) => {
        const values = Array.from(
          new Set(
            templates
              .map((template) => template[config.key])
              .filter((value): value is string => Boolean(value))
          )
        ).sort((a, b) => a.localeCompare(b));
        return [config.key, values];
      })
    ) as Record<(typeof filterConfig)[number]["key"], string[]>;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesQuery =
        !normalizedQuery ||
        [template.name, template.description, template.body_region, template.goal, template.equipment]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));

      const matchesFilters = filterConfig.every((config) => {
        const filterValue = filters[config.key];
        return !filterValue || template[config.key] === filterValue;
      });

      return matchesQuery && matchesFilters;
    });
  }, [filters, query, templates]);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-900/70 dark:to-slate-950/60">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Dumbbell className="h-4 w-4 text-primary" aria-hidden />
            Exercise library
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Search recovery-focused exercises, then assign one to the selected plan.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {filteredTemplates.length} shown
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by exercise, goal, equipment, or cue"
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {filterConfig.map((config) => (
            <select
              key={config.key}
              value={filters[config.key] ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, [config.key]: event.target.value }))
              }
              className="rounded-lg border bg-background px-3 py-2 text-sm"
              aria-label={`Filter by ${config.label.toLowerCase()}`}
            >
              <option value="">{config.label}</option>
              {filterOptions[config.key].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filteredTemplates.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground lg:col-span-2">
            No exercises match those filters.
          </div>
        )}
        {filteredTemplates.map((template) => {
          const selected = selectedTemplateId === template.id;
          const videoUrl = getVideoUrl(template);
          return (
            <div
              key={template.id}
              className={`rounded-lg border bg-background p-3 transition-colors ${
                selected ? "border-primary/50 ring-2 ring-primary/10" : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-foreground">{template.name}</div>
                  {template.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
                <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => onSelectTemplate(template.id)}>
                  {selected ? "Selected" : "Assign"}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[template.body_region, template.recovery_phase, template.goal, template.equipment, template.difficulty]
                  .filter(Boolean)
                  .map((value, index) => (
                    <span key={`${value}-${index}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {value}
                    </span>
                  ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                <span className="capitalize">Video: {getVideoStatus(template.id)}</span>
                <div className="flex items-center gap-2">
                  {videoUrl && (
                    <a href={videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline hover:text-foreground">
                      <Video className="h-3.5 w-3.5" aria-hidden />
                      View
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onQueueVideo(template)}
                    disabled={queueingVideoForTemplateId === template.id}
                  >
                    {queueingVideoForTemplateId === template.id ? "Queueing..." : videoUrl ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
