"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BodyMapAnnotation {
  id: string;
  x: number; // 0-1, relative position
  y: number; // 0-1, relative position
  side: "front" | "back";
  intensity: number; // 1-10 pain scale
  note?: string;
}

interface BodyMapProps {
  annotations: BodyMapAnnotation[];
  onAnnotationAdd: (annotation: BodyMapAnnotation) => void;
  onAnnotationRemove: (id: string) => void;
  onAnnotationUpdate: (id: string, annotation: Partial<BodyMapAnnotation>) => void;
  disabled?: boolean;
}

function getAnnotationColor(intensity: number) {
  if (intensity <= 2) return "var(--pain-1)";
  if (intensity <= 4) return "var(--pain-2)";
  if (intensity <= 6) return "var(--pain-3)";
  if (intensity <= 8) return "var(--pain-4)";
  return "var(--pain-5)";
}

/** Shared silhouette styling */
const silhouetteClass = "fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600";

/** Front view: simplified human silhouette */
function FrontSilhouette() {
  return (
    <g className={silhouetteClass} strokeWidth="1.5">
      <ellipse cx="100" cy="44" rx="24" ry="28" />
      <path d="M 80 70 L 76 84 L 124 84 L 120 70 Z" fill="inherit" stroke="inherit" />
      <rect x="76" y="84" width="48" height="116" rx="6" fill="inherit" stroke="inherit" />
      <rect x="38" y="88" width="28" height="78" rx="14" fill="inherit" stroke="inherit" />
      <rect x="134" y="88" width="28" height="78" rx="14" fill="inherit" stroke="inherit" />
      <rect x="76" y="200" width="24" height="152" rx="12" fill="inherit" stroke="inherit" />
      <rect x="100" y="200" width="24" height="152" rx="12" fill="inherit" stroke="inherit" />
      <text x="100" y="165" textAnchor="middle" fill="#94a3b8" style={{ fontSize: "14px", fontWeight: 500 }}>Front</text>
    </g>
  );
}

/** Back view - same outline, with "Back" label so the toggle is clearly visible */
function BackSilhouette() {
  return (
    <g className={silhouetteClass} strokeWidth="1.5">
      <ellipse cx="100" cy="44" rx="24" ry="28" />
      <path d="M 80 70 L 76 84 L 124 84 L 120 70 Z" fill="inherit" stroke="inherit" />
      <rect x="76" y="84" width="48" height="116" rx="6" fill="inherit" stroke="inherit" />
      <rect x="38" y="88" width="28" height="78" rx="14" fill="inherit" stroke="inherit" />
      <rect x="134" y="88" width="28" height="78" rx="14" fill="inherit" stroke="inherit" />
      <rect x="76" y="200" width="24" height="152" rx="12" fill="inherit" stroke="inherit" />
      <rect x="100" y="200" width="24" height="152" rx="12" fill="inherit" stroke="inherit" />
      <text x="100" y="165" textAnchor="middle" fill="#94a3b8" style={{ fontSize: "14px", fontWeight: 500 }}>Back</text>
    </g>
  );
}

export function BodyMap({
  annotations: annotationsProp,
  onAnnotationAdd,
  onAnnotationRemove,
  onAnnotationUpdate,
  disabled = false,
}: BodyMapProps) {
  const annotations = Array.isArray(annotationsProp) ? annotationsProp : [];
  const [side, setSide] = useState<"front" | "back">("front");
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const newAnnotation: BodyMapAnnotation = {
      id: `annotation-${Date.now()}`,
      x,
      y,
      side,
      intensity: 5,
    };
    onAnnotationAdd(newAnnotation);
    setSelectedAnnotation(newAnnotation.id);
  };

  const currentAnnotations = annotations.filter((a) => a.side === side);

  return (
    <div className="space-y-4">
      {/* Pain scale CSS variables - green → red */}
      <style>{`
        .body-map-figure {
          --pain-1: #22c55e;
          --pain-2: #84cc16;
          --pain-3: #eab308;
          --pain-4: #f97316;
          --pain-5: #ef4444;
        }
      `}</style>

      {/* Front / Back toggle - always clickable so you can switch views when viewing SOAP notes */}
      <div className="relative z-10 inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
        <Button
          type="button"
          variant={side === "front" ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSide("front");
          }}
          className={`rounded-full ${
            side === "front"
              ? "shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          } ${disabled ? "opacity-80" : ""}`}
        >
          Front
        </Button>
        <Button
          type="button"
          variant={side === "back" ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSide("back");
          }}
          className={`rounded-full ${
            side === "back"
              ? "shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          } ${disabled ? "opacity-80" : ""}`}
        >
          Back
        </Button>
      </div>

      <div ref={containerRef} className="body-map-figure relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shadow-inner">
        <svg
          ref={svgRef}
          viewBox="0 0 200 400"
          preserveAspectRatio="xMidYMid meet"
          className={`w-full h-auto ${disabled ? "opacity-70" : ""}`}
          style={{ minHeight: "380px", cursor: disabled ? "default" : "crosshair" }}
          onClick={handleSvgClick}
        >
          {side === "front" ? <FrontSilhouette /> : <BackSilhouette />}

          {/* Annotations */}
          {currentAnnotations.map((annotation) => {
            const x = annotation.x * 200;
            const y = annotation.y * 400;
            const color = getAnnotationColor(annotation.intensity);
            const isHovered = hoveredAnnotation === annotation.id;
            const isSelected = selectedAnnotation === annotation.id;
            const r = isSelected ? 11 : isHovered ? 10 : 8;

            return (
              <g key={annotation.id}>
                {/* Soft outer glow when selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill={color}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={color}
                  stroke="white"
                  strokeWidth="2.5"
                  className={`transition-all duration-200 ${!disabled ? "cursor-pointer" : ""}`}
                  style={{
                    filter: isHovered || isSelected ? "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setSelectedAnnotation(annotation.id);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredAnnotation(annotation.id);
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (containerRef.current && hoveredAnnotation === annotation.id) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredAnnotation(null);
                    setHoverPosition(null);
                  }}
                />
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="5,4"
                    opacity="0.9"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredAnnotation && hoverPosition && !selectedAnnotation && (() => {
          const annotation = currentAnnotations.find((a) => a.id === hoveredAnnotation);
          if (!annotation) return null;
          const tw = 200;
          const th = 70;
          const pad = 12;
          let tx = hoverPosition.x + pad;
          let ty = hoverPosition.y - th - pad;
          if (containerRef.current) {
            const w = containerRef.current.offsetWidth;
            const h = containerRef.current.offsetHeight;
            if (tx + tw > w) tx = hoverPosition.x - tw - pad;
            if (tx < 0) tx = pad;
            if (ty < 0) ty = hoverPosition.y + pad;
          }
          return (
            <div
              className="absolute z-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg text-left pointer-events-none"
              style={{
                left: `${tx}px`,
                top: `${ty}px`,
                maxWidth: "220px",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getAnnotationColor(annotation.intensity) }}
                />
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Pain {annotation.intensity}/10
                </span>
              </div>
              {annotation.note ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {annotation.note}
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">Click to add details</p>
              )}
            </div>
          );
        })()}

        {/* Selected annotation details panel */}
        {selectedAnnotation && (
          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Pain point</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => {
                  onAnnotationRemove(selectedAnnotation);
                  setSelectedAnnotation(null);
                }}
                aria-label="Remove point"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Intensity (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentAnnotations.find((a) => a.id === selectedAnnotation)?.intensity ?? 5}
                    onChange={(e) =>
                      onAnnotationUpdate(selectedAnnotation, { intensity: parseInt(e.target.value, 10) })
                    }
                    className="flex-1 h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-600 accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-400 [&::-webkit-slider-thumb]:shadow"
                  />
                  <span
                    className="text-sm font-medium tabular-nums w-8"
                    style={{
                      color: getAnnotationColor(
                        currentAnnotations.find((a) => a.id === selectedAnnotation)?.intensity ?? 5
                      ),
                    }}
                  >
                    {currentAnnotations.find((a) => a.id === selectedAnnotation)?.intensity ?? 5}/10
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Notes
                </label>
                <textarea
                  value={currentAnnotations.find((a) => a.id === selectedAnnotation)?.note ?? ""}
                  onChange={(e) => onAnnotationUpdate(selectedAnnotation, { note: e.target.value })}
                  placeholder="e.g. sharp when moving, better at rest"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pain scale legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>Pain scale:</span>
        {[1, 3, 5, 7, 10].map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: getAnnotationColor(n) }}
            />
            {n === 1 ? "1" : n === 10 ? "10" : n}
          </span>
        ))}
      </div>

      {currentAnnotations.length > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {currentAnnotations.length} point{currentAnnotations.length !== 1 ? "s" : ""} on {side} view
        </p>
      )}
    </div>
  );
}
