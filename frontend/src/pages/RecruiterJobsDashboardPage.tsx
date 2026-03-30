import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatDateBR } from "../lib/time";
import { CompanyLogoPlaceholder } from "../components/CompanyLogoPlaceholder";

type RecruiterJobRow = {
  id: number;
  title: string;
  salary_range?: string | null;
  is_active: boolean;
  created_at?: string | null;
  company: { id: number; name: string; logo_s3_key?: string | null };
  tags: string[];
  applications_count: number;
};

export function RecruiterJobsDashboardPage() {
  const [jobs, setJobs] = useState<RecruiterJobRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ jobs: RecruiterJobRow[] }>("/api/v1/recruiter/jobs");
        if (!cancelled) {
          setJobs(res.jobs ?? []);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Erro ao carregar vagas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.is_active).length;
    const applications = jobs.reduce((s, j) => s + (j.applications_count ?? 0), 0);
    return { total, active, applications };
  }, [jobs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Carregando…</div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">{err}</div>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Link to="/recruiter" className="text-gray-500 hover:text-primary transition-colors mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Dashboard de vagas</h1>
            </div>
            <p className="text-gray-600">Visualize e gerencie todas as suas vagas publicadas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/recruiter/companies"
              className="inline-flex items-center justify-center px-4 py-2 border-2 border-gray-300 text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Gerenciar empresas
            </Link>
            <Link
              to="/recruiter/jobs/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova vaga
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-xl">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de vagas</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Vagas ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-secondary/10 p-3 rounded-xl">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de candidaturas</p>
                <p className="text-2xl font-bold text-secondary">{stats.applications}</p>
              </div>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Nenhuma vaga publicada</h2>
              <p className="text-gray-600 mb-8">
                Publique sua primeira vaga e comece a receber candidaturas qualificadas.
              </p>
              <Link
                to="/recruiter/jobs/new"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Publicar primeira vaga
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-foreground">Todas as vagas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Vaga</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Empresa</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Candidaturas</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Publicada em</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          {job.salary_range ? (
                            <p className="text-xs text-gray-500">{job.salary_range}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <CompanyLogoPlaceholder className="w-8 h-8 mr-3" />
                          <span className="text-sm text-foreground">{job.company.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {job.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-foreground">{job.applications_count}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-500">{formatDateBR(job.created_at)}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/recruiter/jobs/${job.id}/edit`}
                          className="inline-flex items-center text-gray-500 hover:text-primary transition-colors text-sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
