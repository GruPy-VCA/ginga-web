import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatDateBR } from "../lib/time";
import { CompanyLogoImage } from "../components/CompanyLogoImage";

type CompanyJob = {
  id: number;
  title: string;
  is_active: boolean;
  applications_count: number;
  created_at?: string | null;
};

type CompanyRow = {
  id: number;
  name: string;
  cnpj: string;
  website?: string | null;
  description?: string | null;
  logo_s3_key?: string | null;
  jobs: CompanyJob[];
};

export function RecruiterCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCompanies = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiFetch<{ companies: CompanyRow[] }>("/api/v1/companies/mine");
      setCompanies(res.companies ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  async function handleDelete(id: number, name: string) {
    if (
      !window.confirm(
        `Excluir a empresa "${name}"? Esta ação não pode ser desfeita. Vagas ligadas a ela podem ser afetadas.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    setErr(null);
    try {
      await apiFetch(`/api/v1/companies/${id}`, { method: "DELETE" });
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Carregando…</div>
    );
  }

  if (err && companies.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">{err}</div>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link to="/recruiter" className="text-gray-500 hover:text-primary transition-colors mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Gestão de empresas</h1>
            </div>
            <p className="text-gray-600">Gerencie suas empresas e vagas publicadas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Link
              to="/recruiter/jobs"
              className="inline-flex items-center justify-center px-4 py-2 border-2 border-gray-300 text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Dashboard de vagas
            </Link>
            <Link
              to="/recruiter/companies/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrar nova empresa
            </Link>
          </div>
        </div>

        {err ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div>
        ) : null}

        {companies.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Ainda não há empresa cadastrada</h2>
              <p className="text-gray-600 mb-8">
                Cadastre sua empresa para começar a publicar vagas e encontrar talentos no Ginga.
              </p>
              <Link
                to="/recruiter/companies/new"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Registrar empresa
              </Link>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4">Com uma empresa cadastrada você pode:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-2 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Publicar vagas com detalhes técnicos</span>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-2 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Gerir candidaturas recebidas</span>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-2 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Dar feedback aos candidatos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {companies.map((item) => {
              const totalJobs = item.jobs.length;
              const activeJobs = item.jobs.filter((j) => j.is_active).length;
              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center">
                        <CompanyLogoImage s3Key={item.logo_s3_key} className="w-16 h-16" alt={item.name} />
                        <div className="ml-4">
                          <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
                          <p className="text-gray-500 text-sm">CNPJ: {item.cnpj}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/recruiter/companies/${item.id}/jobs/new`}
                          className="inline-flex items-center px-4 py-2 bg-secondary text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Nova vaga
                        </Link>
                        <Link
                          to={`/recruiter/companies/${item.id}/edit`}
                          className="inline-flex items-center px-4 py-2 border-2 border-gray-300 text-foreground font-semibold rounded-xl text-sm hover:border-primary hover:text-primary transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Editar empresa
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => void handleDelete(item.id, item.name)}
                          className="inline-flex items-center text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          {deletingId === item.id ? "Excluindo…" : "Excluir"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500">Total de vagas:</span>
                        <span className="ml-2 font-semibold text-foreground">{totalJobs}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500">Vagas ativas:</span>
                        <span className="ml-2 font-semibold text-primary">{activeJobs}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {item.jobs.length === 0 ? (
                      <div className="text-center py-8 bg-background rounded-xl">
                        <p className="text-gray-500 text-sm mb-3">Nenhuma vaga publicada</p>
                        <Link
                          to={`/recruiter/companies/${item.id}/jobs/new`}
                          className="text-secondary font-semibold text-sm hover:text-secondary-600 transition-colors"
                        >
                          Publicar primeira vaga →
                        </Link>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                          Vagas publicadas
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vaga</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                  Candidaturas
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                  Publicada em
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.jobs.map((job) => (
                                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                  <td className="py-4 px-4">
                                    <Link
                                      to={`/jobs/${job.id}`}
                                      className="font-semibold text-foreground hover:text-primary"
                                    >
                                      {job.title}
                                    </Link>
                                  </td>
                                  <td className="py-4 px-4">
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
                                  <td className="py-4 px-4">
                                    <span className="font-semibold text-foreground">{job.applications_count}</span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-sm text-gray-500">{formatDateBR(job.created_at)}</span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <Link
                                      to={`/recruiter/jobs/${job.id}/edit`}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      Editar
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
