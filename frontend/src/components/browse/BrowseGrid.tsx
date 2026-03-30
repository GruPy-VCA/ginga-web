import type { ReactNode } from "react";

/** Mesmo grid da listagem de vagas: sidebar 1 col + conteúdo 3 cols. */
export function BrowseGrid({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">{sidebar}</div>
      <div className="lg:col-span-3">{children}</div>
    </div>
  );
}
