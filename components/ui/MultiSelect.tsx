"use client";

import { useEffect, useRef, useState } from "react";

interface MultiSelectProps {
  id: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select options…",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (option: string) => {
    onChange(
      value.includes(option) ? value.filter((v) => v !== option) : [...value, option]
    );
  };

  const remove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{
          minHeight: 42,
          padding: "6px 36px 6px 10px",
          border: "1.5px solid var(--gray-200)",
          borderRadius: 10,
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          transition: "border-color .15s, box-shadow .15s",
          ...(open
            ? { borderColor: "var(--indigo-light)", boxShadow: "0 0 0 3px var(--indigo-soft)" }
            : {}),
        }}
      >
        {value.length === 0 ? (
          <span style={{ color: "var(--gray-400)", fontSize: 14 }}>{placeholder}</span>
        ) : (
          value.map((v) => (
            <span
              key={v}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "var(--indigo-soft)",
                color: "var(--indigo)",
                fontSize: 12.5,
                fontWeight: 600,
                padding: "3px 8px 3px 10px",
                borderRadius: 6,
              }}
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={(e) => remove(v, e)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--indigo)",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                  fontSize: 13,
                  opacity: 0.7,
                  fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            </span>
          ))
        )}

        {/* Chevron */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform .15s",
            color: "var(--gray-400)",
            pointerEvents: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid var(--gray-200)",
            borderRadius: 10,
            boxShadow: "var(--shadow-lg)",
            zIndex: 30,
            maxHeight: 220,
            overflowY: "auto",
            padding: "6px 0",
            margin: 0,
            listStyle: "none",
          }}
        >
          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <li
                key={option}
                role="option"
                aria-selected={selected}
                onClick={() => toggle(option)}
                onKeyDown={(e) => { if (e.key === "Enter") toggle(option); }}
                tabIndex={0}
                style={{
                  padding: "9px 14px",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: selected ? "var(--indigo-soft)" : "transparent",
                  color: selected ? "var(--indigo)" : "var(--gray-900)",
                  fontWeight: selected ? 600 : 400,
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => {
                  if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--gray-50)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Checkbox indicator */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: selected ? "none" : "1.5px solid var(--gray-300, #cbd5e1)",
                    background: selected ? "var(--indigo-light)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M4 12.5l5.5 5.5L20 6.5" />
                    </svg>
                  )}
                </span>
                {option}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
