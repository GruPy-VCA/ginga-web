import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { formatTimeAgo } from "../lib/time";
import { CompanyLogoPlaceholder } from "../components/CompanyLogoPlaceholder";

type JobDetail = {
  id: number;
  title: string;
  description: string;
  requirements?: string | null;
  salary_range?: string | null;
  is_active: boolean;
  created_at?: string | null;
  company: {
    id: number;
    name: string;
    website?: string | null;
    description?: string | null;
  };
  tags: string[];
};

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const id = Number(jobId);
  const { user } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [myApplication, setMyApplication] = useState<{ id: number; status: string } | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyErr, setApplyErr] = useState<string | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) {
      setErr("Vaga inválida");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const j = await apiFetch<JobDetail>(`/api/v1/jobs/${id}`);
      setJob(j);

      if (user) {
        const [companiesRes, appsRes] = await Promise.all([
          apiFetch<{ companies: { id: number }[] }>("/api/v1/companies/mine"),
          apiFetch<{ results: { id: number; job: { id: number }; status: string }[] }>(
            "/api/v1/applications?page_size=100",
          ),
        ]);
        const owns = companiesRes.companies?.some((c) => c.id === j.company.id) ?? false;
        setIsOwner(owns);
        const mine = appsRes.results?.find((a) => a.job.id === j.id);
        setMyApplication(mine ? { id: mine.id, status: mine.status } : null);
      } else {
        setIsOwner(false);
        setMyApplication(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Vaga não encontrada");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !job) return;
    setApplyErr(null);
    setApplySubmitting(true);
    try {
      await apiFetch(`/api/v1/jobs/${job.id}/applications`, {
        method: "POST",
        body: JSON.stringify({ cover_letter: coverLetter }),
      });
      await load();
      setCoverLetter("");
    } catch (e) {
      setApplyErr(e instanceof Error ? e.message : "Não foi possível candidatar-se");
    } finally {
      setApplySubmitting(false);
    }
  }

  async function handleWithdraw(applicationId: number) {
    if (!confirm("Tem certeza que deseja retirar sua candidatura?")) return;
    try {
      await apiFetch(`/api/v1/applications/${applicationId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setApplyErr(e instanceof Error ? e.message : "Erro ao retirar candidatura");
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-gray-500">Carregando vaga…</div>
    );
  }

  if (err || !job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 mb-6">{err}</div>
        <Link to="/jobs" className="text-primary font-semibold hover:underline">
          Voltar às vagas
        </Link>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/jobs"
          className="inline-flex items-center text-gray-500 hover:text-primary transition-colors mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para vagas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <div className="flex items-start space-x-4">
                <CompanyLogoPlaceholder className="w-16 h-16" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                      <p className="text-gray-600 text-lg">{job.company.name}</p>
                    </div>
                    {!job.is_active ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full shrink-0">
                        Vaga inativa
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    {job.salary_range ? (
                      <span className="inline-flex items-center text-primary font-semibold">
                        {job.salary_range}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center text-gray-500">
                      Publicada {formatTimeAgo(job.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {job.tags?.length ? (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Tecnologias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <Link
                        key={t}
                        to={`/jobs?tag=${encodeURIComponent(t)}`}
                        className="px-3 py-1 bg-secondary/10 text-secondary text-sm rounded-full hover:bg-secondary/20 transition-colors"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-foreground mb-4">Descrição da vaga</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</div>
            </div>

            {job.requirements ? (
              <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-foreground mb-4">Requisitos</h2>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100 lg:sticky lg:top-24">
              {isOwner ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Esta é sua vaga</h3>
                  <p className="text-gray-500 text-sm mb-4">Gerencie no painel de empresas e recrutador.</p>
                  <Link
                    to="/recruiter"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    Área do recrutador
                  </Link>
                </div>
              ) : myApplication?.status === "applied" ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Você já se candidatou</h3>
                  <button
                    type="button"
                    onClick={() => void handleWithdraw(myApplication.id)}
                    className="w-full px-4 py-2 border-2 border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm mt-4"
                  >
                    Retirar candidatura
                  </button>
                </div>
              ) : myApplication ? (
                <div className="text-center">
                  <h3 className="font-bold text-foreground mb-2">Candidatura registrada</h3>
                  <p className="text-gray-500 text-sm">
                    Status: <span className="font-medium text-primary">{myApplication.status}</span>
                  </p>
                  <Link to="/applications" className="mt-4 inline-block text-primary font-semibold text-sm">
                    Ver candidaturas →
                  </Link>
                </div>
              ) : !job.is_active ? (
                <div className="text-center">
                  <h3 className="font-bold text-foreground mb-2">Vaga fechada</h3>
                  <p className="text-gray-500 text-sm">Esta vaga não aceita novas candidaturas.</p>
                </div>
              ) : user ? (
                <>
                  <h3 className="font-bold text-foreground mb-4 text-center">Candidate-se a esta vaga</h3>
                  <form onSubmit={(e) => void handleApply(e)}>
                    <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-2">
                      Carta de apresentação (opcional)
                    </label>
                    <textarea
                      id="cover"
                      rows={5}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                    {applyErr ? (
                      <p className="text-red-600 text-sm mt-2">{applyErr}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={applySubmitting}
                      className="w-full mt-4 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {applySubmitting ? "Enviando…" : "Enviar candidatura"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-4">Entre com sua conta para se candidatar.</p>
                  <Link
                    to="/login"
                    state={{ from: `/jobs/${job.id}` }}
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    Entrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
