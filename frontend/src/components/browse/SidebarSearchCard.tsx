import type { FormEvent } from "react";

type Props = {
  localQ: string;
  onLocalQChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
};

export function SidebarSearchCard({
  localQ,
  onLocalQChange,
  onSubmit,
  placeholder = "Cargo, empresa ou tecnologia…",
}: Props) {
  return (
    <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100 mb-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Buscar
      </h3>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={localQ}
          onChange={(e) => onLocalQChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <button
          type="submit"
          className="w-full mt-3 px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
