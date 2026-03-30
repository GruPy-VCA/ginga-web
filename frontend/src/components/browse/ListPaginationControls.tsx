import type { SetURLSearchParams } from "react-router-dom";

type Props = {
  page: number;
  totalPages: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

export function ListPaginationControls({ page, totalPages, searchParams, setSearchParams }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex justify-center">
      <nav className="inline-flex rounded-xl shadow-[var(--shadow-soft)] overflow-hidden border border-gray-100">
        {page > 1 ? (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page - 1));
              setSearchParams(next);
            }}
            className="px-4 py-2 bg-surface text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            ← Anterior
          </button>
        ) : null}
        <span className="px-4 py-2 bg-primary text-white font-medium">
          Página {page} de {totalPages}
        </span>
        {page < totalPages ? (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page + 1));
              setSearchParams(next);
            }}
            className="px-4 py-2 bg-surface text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-100"
          >
            Próxima →
          </button>
        ) : null}
      </nav>
    </div>
  );
}
