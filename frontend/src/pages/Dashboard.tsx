import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { fetchPrivateImageUrl } from "../lib/imageUpload";
import { formatTimeAgo } from "../lib/time";
import { CompanyLogoPlaceholder } from "../components/CompanyLogoPlaceholder";
import { applicationStatusClasses, applicationStatusLabel } from "../lib/jobStatus";

type MeProfile = {
  bio?: string | null;
  city?: string | null;
  avatar_s3_key?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  skills?: string | null;
} | null;

type Me = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile?: MeProfile;
};

type JobSummary = {
  id: number;
  title: string;
  salary_range?: string | null;
  created_at?: string | null;
  company: { id: number; name: string; logo_s3_key?: string | null };
  tags: string[];
};

type ApplicationRow = {
  id: number;
  status: string;
  applied_at?: string | null;
  job: {
    id: number;
    title: string;
    company: { id: number; name: string; logo_s3_key?: string | null };
  };
};

function profileProgress(profile: MeProfile, me: Me): { pct: number; label: string } {
  const hasName = Boolean(me.first_name?.trim() && me.last_name?.trim());
  const bio = Boolean(profile?.bio?.trim());
  const city = Boolean(profile?.city?.trim());
  const gh = Boolean(profile?.github_url?.trim());
  if (hasName && bio && city && gh) return { pct: 100, label: "100%" };
  if (hasName && bio && city) return { pct: 75, label: "75%" };
  if (bio || city) return { pct: 50, label: "50%" };
  return { pct: 25, label: "25%" };
}

function initials(me: Me): string {
  const f = me.first_name?.charAt(0) ?? "";
  const l = me.last_name?.charAt(0) ?? "";
  if (f || l) return (f + l).toUpperCase();
  return (me.username ?? me.email ?? "?").slice(0, 2).toUpperCase();
}

function displayName(me: Me): string {
  const fn = me.first_name?.trim();
  const ln = me.last_name?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  return me.username ?? me.email ?? "Usuário";
}

export function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [recommended, setRecommended] = useState<JobSummary[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, rec, apps] = await Promise.all([
          apiFetch<Me>("/api/v1/me"),
          apiFetch<{ jobs: JobSummary[] }>("/api/v1/dashboard/recommended-jobs"),
          apiFetch<{ results: ApplicationRow[]; total: number }>(
            "/api/v1/applications?page=1&page_size=4",
          ),
        ]);
        if (!cancelled) {
          setMe(m);
          setRecommended(rec.jobs ?? []);
          setApplications(apps.results ?? []);
          setTotalApplications(apps.total ?? 0);
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

  useEffect(() => {
    const key = me?.profile?.avatar_s3_key?.trim();
    if (!key) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = await fetchPrivateImageUrl(key);
        if (!cancelled) setAvatarUrl(url);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me?.profile?.avatar_s3_key]);

  const progress = useMemo(
    () => profileProgress(me?.profile ?? null, me ?? { id: "", email: "" }),
    [me],
  );

  const hasSkills = Boolean(me?.profile?.skills?.trim());

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground/70">
        Carregando painel…
      </div>
    );
  }

  if (err || !me) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          <p className="font-semibold mb-2">Não foi possível carregar o dashboard</p>
          <p className="text-sm">{err ?? "Perfil indisponível."}</p>
        </div>
      </div>
    );
  }

  const p = me.profile;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {me.first_name?.trim() || me.username || "visitante"}!
          </h1>
          <p className="text-gray-600 mt-1">Bem-vindo ao seu painel Ginga</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Vagas recomendadas
                </h2>
                <Link
                  to="/jobs?sort=recommended"
                  className="text-secondary text-sm font-semibold hover:text-secondary-600 transition-colors"
                >
                  Ver todas →
                </Link>
              </div>
              <div className="space-y-4">
                {recommended.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">Nenhuma vaga disponível no momento</p>
                    <p className="text-gray-400 text-sm">
                      {!hasSkills ? (
                        <>
                          <Link to="/profile" className="text-primary hover:underline">
                            Adicione suas competências
                          </Link>{" "}
                          no perfil para receber recomendações personalizadas.
                        </>
                      ) : (
                        "Volte em breve para novas oportunidades!"
                      )}
                    </p>
                  </div>
                ) : (
                  recommended.map((job, idx) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="block border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <CompanyLogoPlaceholder className="w-12 h-12" />
                          <div>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-gray-500 text-sm">{job.company.name}</p>
                            <div className="flex items-center space-x-3 mt-2">
                              {job.salary_range ? (
                                <span className="text-xs text-primary font-medium">
                                  {job.salary_range}
                                </span>
                              ) : null}
                              <span className="text-xs text-gray-400">{formatTimeAgo(job.created_at)}</span>
                            </div>
                            {job.tags?.length ? (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {job.tags.slice(0, 5).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {idx === 0 ? (
                          <span className="px-3 py-1 bg-highlight/20 text-highlight-700 text-xs font-semibold rounded-full shrink-0">
                            Nova
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Minhas candidaturas
                </h2>
                {totalApplications > 3 ? (
                  <Link
                    to="/applications"
                    className="text-secondary text-sm font-semibold hover:text-secondary-600 transition-colors"
                  >
                    Ver todas ({totalApplications}) →
                  </Link>
                ) : null}
              </div>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-3">Você ainda não se candidatou a nenhuma vaga</p>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center text-primary font-semibold hover:underline"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Explorar vagas
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((application) => (
                    <Link
                      key={application.id}
                      to={`/jobs/${application.job.id}`}
                      className="block bg-background rounded-xl p-4 hover:shadow-sm border border-gray-50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <CompanyLogoPlaceholder className="w-10 h-10 rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate">
                              {application.job.title}
                            </h3>
                            <p className="text-gray-500 text-xs">{application.job.company.name}</p>
                            <p className="text-gray-400 text-xs mt-1">{formatTimeAgo(application.applied_at)}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ${applicationStatusClasses(application.status)}`}
                        >
                          {applicationStatusLabel(application.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Meu perfil
              </h2>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-3 overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{initials(me)}</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{displayName(me)}</h3>
                <p className="text-gray-500 text-sm">{me.email}</p>
                {p?.city ? (
                  <p className="text-gray-400 text-xs mt-1 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    {p.city}
                  </p>
                ) : null}
              </div>
              {p?.bio ? (
                <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">{p.bio}</p>
              ) : null}
              <Link
                to="/profile"
                className="block w-full text-center px-4 py-3 border-2 border-primary text-primary font-semibold rounded-xl text-sm hover:bg-primary hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
              >
                Editar perfil
              </Link>
            </div>

            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-highlight"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Perfil
              </h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-semibold text-primary">{progress.label}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-sm">
                  {me.first_name?.trim() && me.last_name?.trim() ? (
                    <>
                      <CheckIcon />
                      <span className="text-gray-600">Nome completo</span>
                    </>
                  ) : (
                    <>
                      <PendingIcon />
                      <span className="text-gray-400">Adicionar nome completo</span>
                    </>
                  )}
                </li>
                <li className="flex items-center text-sm">
                  {p?.bio?.trim() ? (
                    <>
                      <CheckIcon />
                      <span className="text-gray-600">Bio adicionada</span>
                    </>
                  ) : (
                    <>
                      <PendingIcon />
                      <span className="text-gray-400">Adicionar bio</span>
                    </>
                  )}
                </li>
                <li className="flex items-center text-sm">
                  {p?.city?.trim() ? (
                    <>
                      <CheckIcon />
                      <span className="text-gray-600">Localização</span>
                    </>
                  ) : (
                    <>
                      <PendingIcon />
                      <span className="text-gray-400">Adicionar localização</span>
                    </>
                  )}
                </li>
                <li className="flex items-center text-sm">
                  {p?.github_url?.trim() ? (
                    <>
                      <CheckIcon />
                      <span className="text-gray-600">GitHub conectado</span>
                    </>
                  ) : (
                    <>
                      <PendingIcon />
                      <span className="text-gray-400">Conectar GitHub</span>
                    </>
                  )}
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground ml-3">Recrutamento</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Está buscando talentos? Publique vagas e gere candidatos no Ginga.
              </p>
              <Link
                to="/recruiter"
                className="block w-full text-center bg-primary text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-600 transition-colors"
              >
                Mudar para recrutador
              </Link>
            </div>

            <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Links sociais
              </h2>
              <div className="space-y-3">
                {p?.github_url ? (
                  <a
                    href={p.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-background rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <GithubIcon />
                    <span className="text-sm text-gray-600 group-hover:text-foreground transition-colors">
                      GitHub
                    </span>
                    <ExternalIcon />
                  </a>
                ) : (
                  <div className="flex items-center p-3 bg-background rounded-xl border-2 border-dashed border-gray-200">
                    <GithubIcon muted />
                    <span className="text-sm text-gray-400">Conectar GitHub</span>
                  </div>
                )}
                {p?.linkedin_url ? (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-background rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <LinkedinIcon />
                    <span className="text-sm text-gray-600 group-hover:text-foreground transition-colors">
                      LinkedIn
                    </span>
                    <ExternalIcon />
                  </a>
                ) : (
                  <div className="flex items-center p-3 bg-background rounded-xl border-2 border-dashed border-gray-200">
                    <LinkedinIcon muted />
                    <span className="text-sm text-gray-400">Conectar LinkedIn</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 mr-3 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      className="w-5 h-5 mr-3 text-gray-300 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function GithubIcon({ muted }: { muted?: boolean }) {
  return (
    <svg
      className={`w-5 h-5 mr-3 shrink-0 ${muted ? "text-gray-400" : "text-gray-600"}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ muted }: { muted?: boolean }) {
  return (
    <svg
      className={`w-5 h-5 mr-3 shrink-0 ${muted ? "text-gray-400" : "text-[#0077B5]"}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      className="w-4 h-4 ml-auto text-gray-400 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
