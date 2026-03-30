import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { BrowseGrid } from "../components/browse/BrowseGrid";
import { BrowsePageShell } from "../components/browse/BrowsePageShell";
import { CompanyDirectoryRow, type PublicCompanySummary } from "../components/browse/CompanyDirectoryRow";
import { ListPaginationControls } from "../components/browse/ListPaginationControls";
import { SidebarSearchCard } from "../components/browse/SidebarSearchCard";

type ListResponse = {
  companies: PublicCompanySummary[];
  total: number;
  page: number;
  page_size: number;
};

export function PublicCompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQ, setLocalQ] = useState(q);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(page));
      params.set("page_size", "12");
      const res = await apiFetch<ListResponse>(`/api/v1/companies/public?${params.toString()}`);
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar empresas");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (localQ.trim()) next.set("q", localQ.trim());
    next.set("page", "1");
    setSearchParams(next);
  }

  const total = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <BrowsePageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
          <p className="text-gray-600 mt-1">
            {total} empresa{total === 1 ? "" : "s"} cadastrada{total === 1 ? "" : "s"}
            {q ? ` para “${q}”` : ""}
          </p>
        </div>
      </div>

      <BrowseGrid
        sidebar={
          <SidebarSearchCard
            localQ={localQ}
            onLocalQChange={setLocalQ}
            onSubmit={submitSearch}
            placeholder="Nome da empresa…"
          />
        }
      >
        {loading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : err ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">{err}</div>
        ) : !data?.companies.length ? (
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-12 border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-gray-500 mb-6">{q ? "Tente outro termo de busca." : "Ainda não há empresas cadastradas."}</p>
            {q ? (
              <Link
                to="/companies"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
              >
                Ver todas
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.companies.map((c) => (
                <CompanyDirectoryRow key={c.id} company={c} />
              ))}
            </div>
            <ListPaginationControls
              page={page}
              totalPages={totalPages}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
            />
          </>
        )}
      </BrowseGrid>
    </BrowsePageShell>
  );
}
