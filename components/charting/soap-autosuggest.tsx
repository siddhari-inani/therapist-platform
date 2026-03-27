"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles } from "lucide-react";
import { searchTemplates, type SOAPTemplate } from "./soap-templates";
import { cn } from "@/lib/utils";

interface SOAPAutosuggestProps {
  value: string;
  onChange: (value: string) => void;
  section: "subjective" | "objective" | "assessment" | "plan";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SOAPAutosuggest({
  value,
  onChange,
  section,
  placeholder,
  disabled = false,
  className,
}: SOAPAutosuggestProps) {
  const [suggestions, setSuggestions] = useState<SOAPTemplate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [triggerChar, setTriggerChar] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerCharRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    triggerCharRef.current = triggerChar;
  }, [triggerChar]);

  const insertTemplate = useCallback((template: SOAPTemplate) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentTriggerChar = triggerCharRef.current;
    if (!currentTriggerChar) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);

    // Find the trigger character position
    const triggerIndex = textBeforeCursor.lastIndexOf(currentTriggerChar);
    if (triggerIndex === -1) return;

    const beforeTrigger = textarea.value.substring(0, triggerIndex);
    const afterCursor = textarea.value.substring(cursorPos);

    // Insert template content
    const newValue = beforeTrigger + template.content + " " + afterCursor;
    onChange(newValue);

    // Set cursor position after inserted content
    setTimeout(() => {
      const newCursorPos = triggerIndex + template.content.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);

    setShowSuggestions(false);
    setTriggerChar(null);
  }, [onChange]);

  // Check for trigger characters when value changes
  useEffect(() => {
    if (disabled || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastChar = textBeforeCursor[textBeforeCursor.length - 1];

    // Check for trigger characters
    if (lastChar === "/" || lastChar === "@") {
      setTriggerChar(lastChar);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      const results = searchTemplates("", section);
      setSuggestions(results.slice(0, 8)); // Show top 8 suggestions
    } else if (showSuggestions && triggerCharRef.current) {
      // Extract query after trigger character
      const currentTrigger = triggerCharRef.current;
      const match = textBeforeCursor.match(new RegExp(`\\${currentTrigger}([^\\s]*)$`));
      if (match) {
        const query = match[1];
        const results = searchTemplates(query, section);
        setSuggestions(results.slice(0, 8));
      } else {
        setShowSuggestions(false);
        setTriggerChar(null);
      }
    }
  }, [value, showSuggestions, section, disabled]);

  // Handle keyboard navigation
  useEffect(() => {
    if (disabled) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        insertTemplate(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        setTriggerChar(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setTriggerChar(null);
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions, suggestions, selectedIndex, disabled, insertTemplate]);

  const handleSuggestionClick = (template: SOAPTemplate) => {
    insertTemplate(template);
  };

  // Calculate position for suggestions dropdown
  const getSuggestionsPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const rect = textarea.getBoundingClientRect();

    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  };

  const position = showSuggestions ? getSuggestionsPosition() : { top: 0, left: 0, width: 0 };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full p-3 border rounded-md min-h-[120px] resize-y pr-10",
            className
          )}
        />
        {!disabled && (
          <div className="absolute top-2 right-2 text-muted-foreground" title="Type '/' or '@' for template suggestions">
            <Sparkles className="h-4 w-4" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="fixed z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
          }}
        >
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="h-3 w-3" />
              <span>Select a template or continue typing to search</span>
            </div>
          </div>
          {suggestions.map((template, index) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSuggestionClick(template)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors",
                index === selectedIndex && "bg-gray-100"
              )}
            >
              <div className="font-medium text-sm text-gray-900">
                {template.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.content.substring(0, 100)}
                {template.content.length > 100 ? "..." : ""}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {template.category}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
