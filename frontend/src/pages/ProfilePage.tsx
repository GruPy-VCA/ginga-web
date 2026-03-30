import { useEffect, useId, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAmplifyConfigured } from "../config/amplify";
import { ImageUploadField } from "../components/ImageUploadField";
import { apiFetch } from "../lib/api";
import type { Me } from "../types/me";

/** Mesma regra de `app.services.user_service._slugify` (URL pública do perfil). */
function slugifyPreview(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user"
  );
}

function optionalHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Obrigatórios: nome, sobrenome e identificador da URL (slug do perfil). */
function validate(
  identity: { first_name: string; last_name: string; username: string },
  urls: { github_url: string; linkedin_url: string },
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!identity.first_name.trim() || identity.first_name.trim().length < 2) {
    e.first_name = "Informe seu nome (mínimo 2 caracteres).";
  }
  if (!identity.last_name.trim() || identity.last_name.trim().length < 2) {
    e.last_name = "Informe seu sobrenome (mínimo 2 caracteres).";
  }
  const raw = identity.username.trim();
  const slug = slugifyPreview(raw);
  const alnum = raw.replace(/[^a-z0-9]/gi, "");
  if (alnum.length < 3) {
    e.username =
      "Informe um identificador com pelo menos 3 letras ou números (usado na URL pública do perfil).";
  } else if (slug.length > 200) {
    e.username = "Identificador público é longo demais.";
  }
  if (!optionalHttpUrl(urls.github_url)) {
    e.github_url = "URL inválida. Use https://… ou deixe em branco.";
  }
  if (!optionalHttpUrl(urls.linkedin_url)) {
    e.linkedin_url = "URL inválida. Use https://… ou deixe em branco.";
  }
  return e;
}

export function ProfilePage() {
  const { user, loading, me, meLoading, meError, refreshMe } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const formId = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isPortfolioPublic, setIsPortfolioPublic] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [avatarS3Key, setAvatarS3Key] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setFirstName(me.first_name?.trim() ?? "");
    setLastName(me.last_name?.trim() ?? "");
    setUsername(
      (me.profile?.slug ?? me.username ?? "").trim().toLowerCase(),
    );
    const p = me.profile;
    setBio(p?.bio?.trim() ?? "");
    setCity(p?.city?.trim() ?? "");
    setContactInfo(p?.contact_info?.trim() ?? "");
    setSkills(p?.skills?.trim() ?? "");
    setGithubUrl(p?.github_url?.trim() ?? "");
    setLinkedinUrl(p?.linkedin_url?.trim() ?? "");
    setIsPortfolioPublic(p?.is_portfolio_public ?? false);
    setIsPublished(p?.is_published ?? false);
    setAvatarS3Key(p?.avatar_s3_key?.trim() ?? "");
  }, [me]);

  if (!isAmplifyConfigured()) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (loading || (user && meLoading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-foreground/80">
        <p className="text-lg">Carregando seus dados…</p>
      </div>
    );
  }

  if (user && meError && !me) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 mb-6">
          <p className="font-semibold mb-2">Não foi possível carregar o perfil</p>
          <p className="text-sm">{meError}</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshMe()}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const f = {
      first_name: firstName,
      last_name: lastName,
      username: username.trim(),
      bio,
      city,
      contact_info: contactInfo,
      skills,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
    };
    const errs = validate(
      { first_name: f.first_name, last_name: f.last_name, username: f.username },
      { github_url: f.github_url, linkedin_url: f.linkedin_url },
    );
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = document.querySelector<HTMLElement>("[aria-invalid=true]");
      first?.focus();
      return;
    }

    setSaving(true);
    try {
      await apiFetch<Me>("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: f.first_name.trim(),
          last_name: f.last_name.trim(),
          username: f.username,
          profile: {
            bio: f.bio.trim(),
            city: f.city.trim(),
            contact_info: f.contact_info.trim(),
            skills: f.skills.trim(),
            github_url: f.github_url.trim() || null,
            linkedin_url: f.linkedin_url.trim() || null,
            is_portfolio_public: isPortfolioPublic,
            is_published: isPublished,
            avatar_s3_key: avatarS3Key.trim() || null,
          },
        }),
      });
      await refreshMe();
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/profile" ? from : "/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      const showOnPublicIdField =
        /já está em uso|already in use|identificador|slug|conflito|obrigatório|inválido/i.test(
          msg,
        );
      if (showOnPublicIdField) {
        setFieldErrors((prev) => ({ ...prev, username: msg }));
        setSubmitError(null);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const incomplete = me && !me.is_profile_complete;

  return (
    <div className="bg-background min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {incomplete ? "Complete seu perfil" : "Editar perfil"}
          </h1>
          <p className="mt-2 text-foreground/75 max-w-2xl">
            {incomplete
              ? "Nome, sobrenome e identificador público (URL do perfil) são obrigatórios. Os demais campos são opcionais."
              : "Atualize seus dados. Nome, sobrenome e identificador da URL são obrigatórios; o restante é opcional."}
          </p>
        </header>

        <form
          id={formId}
          onSubmit={(e) => void onSubmit(e)}
          className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] border border-primary-100 p-6 sm:p-8 space-y-10"
          noValidate
        >
          <section aria-labelledby={`${formId}-identity`}>
            <h2 id={`${formId}-identity`} className="text-lg font-semibold text-foreground mb-4">
              Identidade
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-fn`} className="block text-sm font-medium text-foreground mb-1">
                  Nome <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${formId}-fn`}
                  name="first_name"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setSubmitError(null);
                  }}
                  aria-invalid={!!fieldErrors.first_name}
                  aria-describedby={fieldErrors.first_name ? `${formId}-fn-err` : undefined}
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                {fieldErrors.first_name ? (
                  <p id={`${formId}-fn-err`} className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.first_name}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor={`${formId}-ln`} className="block text-sm font-medium text-foreground mb-1">
                  Sobrenome <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${formId}-ln`}
                  name="last_name"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setSubmitError(null);
                  }}
                  aria-invalid={!!fieldErrors.last_name}
                  aria-describedby={fieldErrors.last_name ? `${formId}-ln-err` : undefined}
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                {fieldErrors.last_name ? (
                  <p id={`${formId}-ln-err`} className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.last_name}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 max-w-md">
              <label htmlFor={`${formId}-un`} className="block text-sm font-medium text-foreground mb-1">
                Identificador público <span className="text-red-600">*</span>
              </label>
              <input
                id={`${formId}-un`}
                name="profile_slug"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setSubmitError(null);
                  setFieldErrors((prev) => {
                    if (!prev.username) return prev;
                    const next = { ...prev };
                    delete next.username;
                    return next;
                  });
                }}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={
                  fieldErrors.username ? `${formId}-un-hint ${formId}-un-err` : `${formId}-un-hint`
                }
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] font-mono text-sm"
              />
              <p id={`${formId}-un-hint`} className="mt-1 text-xs text-foreground/60">
                Define a URL do seu perfil na plataforma (slug). Letras, números e hífens; espaços viram
                hífen. Ex.: <span className="font-mono">maria-silva</span>
              </p>
              {fieldErrors.username ? (
                <p id={`${formId}-un-err`} className="mt-1 text-sm text-red-700" role="alert">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby={`${formId}-portfolio`}>
            <h2 id={`${formId}-portfolio`} className="text-lg font-semibold text-foreground mb-4">
              Portfólio
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor={`${formId}-bio`} className="block text-sm font-medium text-foreground mb-1">
                  Bio
                </label>
                <textarea
                  id={`${formId}-bio`}
                  name="bio"
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  aria-invalid={!!fieldErrors.bio}
                  placeholder="Breve apresentação profissional…"
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[120px]"
                />
                {fieldErrors.bio ? (
                  <p className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.bio}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${formId}-city`} className="block text-sm font-medium text-foreground mb-1">
                    Cidade / região
                  </label>
                  <input
                    id={`${formId}-city`}
                    name="city"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    aria-invalid={!!fieldErrors.city}
                    className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                  {fieldErrors.city ? (
                    <p className="mt-1 text-sm text-red-700" role="alert">
                      {fieldErrors.city}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label
                    htmlFor={`${formId}-contact`}
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Contato
                  </label>
                  <input
                    id={`${formId}-contact`}
                    name="contact_info"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    aria-invalid={!!fieldErrors.contact_info}
                    placeholder="Telefone, e-mail ou outro"
                    className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                  {fieldErrors.contact_info ? (
                    <p className="mt-1 text-sm text-red-700" role="alert">
                      {fieldErrors.contact_info}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor={`${formId}-skills`} className="block text-sm font-medium text-foreground mb-1">
                  Habilidades
                </label>
                <textarea
                  id={`${formId}-skills`}
                  name="skills"
                  rows={3}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  aria-invalid={!!fieldErrors.skills}
                  placeholder="Separadas por vírgula: Python, Django, PostgreSQL…"
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
                {fieldErrors.skills ? (
                  <p className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.skills}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-labelledby={`${formId}-links`}>
            <h2 id={`${formId}-links`} className="text-lg font-semibold text-foreground mb-4">
              Links
            </h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label htmlFor={`${formId}-gh`} className="block text-sm font-medium text-foreground mb-1">
                  GitHub
                </label>
                <input
                  id={`${formId}-gh`}
                  name="github_url"
                  type="url"
                  inputMode="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  aria-invalid={!!fieldErrors.github_url}
                  placeholder="https://github.com/seu-usuario"
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                {fieldErrors.github_url ? (
                  <p className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.github_url}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor={`${formId}-li`} className="block text-sm font-medium text-foreground mb-1">
                  LinkedIn
                </label>
                <input
                  id={`${formId}-li`}
                  name="linkedin_url"
                  type="url"
                  inputMode="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  aria-invalid={!!fieldErrors.linkedin_url}
                  placeholder="https://www.linkedin.com/in/…"
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                {fieldErrors.linkedin_url ? (
                  <p className="mt-1 text-sm text-red-700" role="alert">
                    {fieldErrors.linkedin_url}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-labelledby={`${formId}-vis`}>
            <h2 id={`${formId}-vis`} className="text-lg font-semibold text-foreground mb-4">
              Visibilidade
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isPortfolioPublic}
                  onChange={(e) => setIsPortfolioPublic(e.target.checked)}
                  className="mt-1 size-5 rounded border-primary-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  Tornar portfólio público <span className="text-foreground/60">(outros podem ver seu perfil)</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-1 size-5 rounded border-primary-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  Marcar como publicado <span className="text-foreground/60">(aparece nas buscas internas)</span>
                </span>
              </label>
            </div>
          </section>

          <section aria-labelledby={`${formId}-adv`}>
            <h2 id={`${formId}-adv`} className="text-lg font-semibold text-foreground mb-4">
              Foto do perfil (opcional)
            </h2>
            <div className="max-w-xl">
              <ImageUploadField
                purpose="avatar"
                value={avatarS3Key}
                onChange={setAvatarS3Key}
                disabled={saving}
                hint="JPG, PNG, GIF ou WebP. A imagem aparece no seu perfil quando visível."
                variant="profile"
              />
            </div>
          </section>

          {submitError ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-primary-100">
            <Link
              to={me?.is_profile_complete ? "/dashboard" : "/"}
              className="inline-flex justify-center items-center px-5 py-3 rounded-xl border border-primary-200 font-semibold text-foreground hover:bg-primary/5 min-h-[44px]"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 disabled:opacity-50 min-h-[44px] min-w-[160px]"
            >
              {saving ? "Salvando…" : "Salvar perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
