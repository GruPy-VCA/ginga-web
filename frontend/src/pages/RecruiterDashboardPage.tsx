import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatTimeAgo } from "../lib/time";

type CompanyMine = { id: number; name: string };
type RecruiterJobRow = {
  id: number;
  title: string;
  is_active: boolean;
  created_at?: string | null;
  company: { id: number; name: string };
  applications_count: number;
};

export function RecruiterDashboardPage() {
  const [companies, setCompanies] = useState<CompanyMine[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobRow[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, jRes, allApps, appliedApps] = await Promise.all([
          apiFetch<{ companies: CompanyMine[] }>("/api/v1/companies/mine"),
          apiFetch<{ jobs: RecruiterJobRow[] }>("/api/v1/recruiter/jobs"),
          apiFetch<{ total: number }>("/api/v1/recruiter/applications?page=1&page_size=1"),
          apiFetch<{ total: number }>("/api/v1/recruiter/applications?status=applied&page=1&page_size=1"),
        ]);
        if (!cancelled) {
          setCompanies(cRes.companies ?? []);
          setJobs(jRes.jobs ?? []);
          setAppTotal(allApps.total ?? 0);
          setPendingApps(appliedApps.total ?? 0);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Erro ao carregar o painel");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const totalJobs = jobs.length;
    const active = jobs.filter((j) => j.is_active).length;
    const inactive = totalJobs - active;
    return {
      companies: companies.length,
      totalJobs,
      active,
      inactive,
      applications: appTotal,
      pending: pendingApps,
    };
  }, [companies.length, jobs, appTotal, pendingApps]);

  const recentJobs = useMemo(() => [...jobs].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 5), [jobs]);

  if (loading) {
    return <p className="text-gray-500">Carregando painel…</p>;
  }

  if (err) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">Resumo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-gray-100 p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-gray-500">Empresas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{kpis.companies}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-100 p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-gray-500">Vagas ativas</p>
            <p className="text-2xl font-bold text-primary mt-1">{kpis.active}</p>
            <p className="text-xs text-gray-400 mt-1">{kpis.inactive} inativa{kpis.inactive === 1 ? "" : "s"}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-100 p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-gray-500">Candidaturas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{kpis.applications}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-100 p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-gray-500">Novas (enviadas)</p>
            <p className="text-2xl font-bold text-secondary mt-1">{kpis.pending}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/recruiter/companies/new"
            className="inline-flex items-center px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            Nova empresa
          </Link>
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center px-4 py-2.5 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors"
          >
            Nova vaga
          </Link>
          <Link
            to="/recruiter/applications"
            className="inline-flex items-center px-4 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Ver candidaturas
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Últimas vagas</h2>
          <Link to="/recruiter/jobs" className="text-sm font-semibold text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="bg-background rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
            <p className="mb-4">Nenhuma vaga ainda.</p>
            <Link to="/recruiter/jobs/new" className="text-primary font-semibold">
              Publicar uma vaga
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentJobs.map((j) => (
              <li
                key={j.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-surface rounded-xl border border-gray-100 px-4 py-3"
              >
                <div>
                  <Link to={`/jobs/${j.id}`} className="font-semibold text-foreground hover:text-primary">
                    {j.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {j.company.name} · {j.applications_count} candidatura
                    {j.applications_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      j.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {j.is_active ? "Ativa" : "Inativa"}
                  </span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(j.created_at)}</span>
                  <Link
                    to={`/recruiter/jobs/${j.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
