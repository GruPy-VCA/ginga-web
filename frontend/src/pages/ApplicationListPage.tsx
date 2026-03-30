import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatTimeAgo } from "../lib/time";
import { CompanyLogoPlaceholder } from "../components/CompanyLogoPlaceholder";
import { applicationStatusClasses, applicationStatusLabel } from "../lib/jobStatus";

type ApplicationRow = {
  id: number;
  status: string;
  cover_letter?: string | null;
  applied_at?: string | null;
  job: {
    id: number;
    title: string;
    is_active: boolean;
    company: { id: number; name: string };
  };
};

type ListResponse = {
  results: ApplicationRow[];
  total: number;
  page: number;
  page_size: number;
  counts: Record<string, number>;
};

export function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", "20");
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch<ListResponse>(`/api/v1/applications?${params.toString()}`);
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar candidaturas");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = data?.counts ?? {};

  const statLink = (s: string, label: string, count: number, color: string) => {
    const active = statusFilter === s;
    return (
      <button
        type="button"
        onClick={() => {
          const next = new URLSearchParams();
          next.set("status", s);
          next.set("page", "1");
          setSearchParams(next);
        }}
        className={`bg-surface rounded-xl p-4 border text-left w-full hover:shadow-sm transition-all ${
          active ? `border-2 ring-2 ${color}` : "border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-2xl font-bold ${active ? "" : "text-gray-800"}`}>{count}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </button>
    );
  };

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.page_size));
  }, [data]);

  async function withdraw(id: number) {
    if (!confirm("Tem certeza que deseja retirar sua candidatura?")) return;
    setWithdrawErr(null);
    try {
      await apiFetch(`/api/v1/applications/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setWithdrawErr(e instanceof Error ? e.message : "Erro ao retirar");
    }
  }

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Minhas candidaturas</h1>
          <p className="text-gray-600 mt-1">
            {data?.total ?? 0} candidatura{(data?.total ?? 0) === 1 ? "" : "s"} no total
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statLink("applied", "Enviadas", counts.applied ?? 0, "border-blue-300 ring-blue-100")}
          {statLink(
            "interviewing",
            "Em entrevista",
            counts.interviewing ?? 0,
            "border-yellow-300 ring-yellow-100",
          )}
          {statLink("approved", "Aprovadas", counts.approved ?? 0, "border-green-300 ring-green-100")}
          {statLink("rejected", "Rejeitadas", counts.rejected ?? 0, "border-red-300 ring-red-100")}
        </div>

        {statusFilter ? (
          <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">
              Filtrando por: <span className="font-semibold">{applicationStatusLabel(statusFilter)}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams();
                next.set("page", "1");
                setSearchParams(next);
              }}
              className="text-sm text-primary hover:underline"
            >
              Limpar filtro
            </button>
          </div>
        ) : null}

        {withdrawErr ? (
          <p className="text-red-600 text-sm mb-4">{withdrawErr}</p>
        ) : null}

        {loading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : err ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{err}</div>
        ) : !data?.results.length ? (
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-12 border border-gray-100 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {statusFilter ? "Nenhuma candidatura com este status" : "Você ainda não se candidatou"}
            </h3>
            <p className="text-gray-500 mb-6">
              {statusFilter ? "Tente remover o filtro ou explore novas vagas." : "Explore as vagas e candidate-se."}
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              Explorar vagas
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.results.map((application) => (
                <div
                  key={application.id}
                  className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <CompanyLogoPlaceholder className="w-14 h-14" />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/jobs/${application.job.id}`}
                            className="font-bold text-foreground text-lg hover:text-primary transition-colors"
                          >
                            {application.job.title}
                          </Link>
                          <p className="text-gray-600">{application.job.company.name}</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Candidatura enviada {formatTimeAgo(application.applied_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${applicationStatusClasses(application.status)}`}
                        >
                          {applicationStatusLabel(application.status)}
                        </span>
                        {!application.job.is_active ? (
                          <span className="mt-2 text-xs text-gray-400">Vaga fechada</span>
                        ) : null}
                      </div>
                    </div>
                    {application.cover_letter ? (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 font-medium mb-1">Carta de apresentação</p>
                        <p className="text-sm text-gray-600 line-clamp-4">{application.cover_letter}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
                    <Link
                      to={`/jobs/${application.job.id}`}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Ver vaga
                    </Link>
                    {application.status === "applied" ? (
                      <button
                        type="button"
                        onClick={() => void withdraw(application.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Retirar candidatura
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
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
                      className="px-4 py-2 bg-surface text-gray-600 hover:bg-gray-50 border-r border-gray-100"
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
                      className="px-4 py-2 bg-surface text-gray-600 hover:bg-gray-50 border-l border-gray-100"
                    >
                      Próxima →
                    </button>
                  ) : null}
                </nav>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
