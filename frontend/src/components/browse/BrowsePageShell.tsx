import type { ReactNode } from "react";

export function BrowsePageShell({ children }: { children: ReactNode }) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
