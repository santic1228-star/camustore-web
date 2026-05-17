"use client";

import { ReactNode } from "react";

// =====================================================
// Label común
// =====================================================
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block font-body text-xs uppercase tracking-widest text-text-secondary mb-1.5">
      {children}
    </label>
  );
}

// =====================================================
// Text input
// =====================================================
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
}

export function TextInput({ value, onChange, placeholder, type = "text", min, max }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors focus:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
    />
  );
}

// =====================================================
// Select / Dropdown
// =====================================================
interface SelectProps<T extends string> {
  value: T | "";
  onChange: (value: T | "") => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}

export function Select<T extends string>({ value, onChange, options, placeholder = "Elegí…" }: SelectProps<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="w-full appearance-none bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 pr-10 font-body text-text-primary outline-none transition-colors focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] cursor-pointer"
      >
        <option value="" className="bg-bg-card">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-bg-card">
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">▾</span>
    </div>
  );
}

// =====================================================
// Checkbox gamer
// =====================================================
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export function Checkbox({ checked, onChange, label, hint }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border transition-all text-left ${
        checked
          ? "bg-neon-cyan/10 border-neon-cyan/60 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          : "bg-bg-card border-border-base hover:border-border-strong"
      }`}
    >
      <div
        className={`w-5 h-5 rounded shrink-0 flex items-center justify-center transition-all ${
          checked
            ? "bg-neon-cyan border-neon-cyan"
            : "bg-bg-deep border border-border-strong"
        }`}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-body text-sm font-medium ${checked ? "text-text-primary" : "text-text-secondary"}`}>
          {label}
        </div>
        {hint && (
          <div className="text-[10px] font-body text-text-muted uppercase tracking-wider mt-0.5">
            {hint}
          </div>
        )}
      </div>
    </button>
  );
}

// =====================================================
// Pill / Toggle binario (Sí/No con estilo)
// =====================================================
interface PillToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}

export function PillToggle({ value, onChange, trueLabel = "Sí", falseLabel = "No" }: PillToggleProps) {
  return (
    <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-all ${
          value
            ? "bg-neon-cyan text-bg-deep font-bold"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-all ${
          !value
            ? "bg-neon-cyan text-bg-deep font-bold"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}
