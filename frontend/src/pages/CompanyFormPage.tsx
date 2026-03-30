import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageUploadField } from "../components/ImageUploadField";
import { apiFetch } from "../lib/api";

type CompanyPayload = {
  id: number;
  name: string;
  cnpj: string;
  website?: string | null;
  description?: string | null;
  logo_s3_key?: string | null;
};

function normalizeCnpjDigits(s: string): string {
  return s.replace(/\D/g, "").slice(0, 14);
}

/** Máscara XX.XXX.XXX/XXXX-00 a partir só de dígitos (digitação ou colagem). */
function formatCnpjMask(digits: string): string {
  const d = normalizeCnpjDigits(digits);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function validate(name: string, cnpjRaw: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!name.trim() || name.trim().length < 2) {
    e.name = "Informe o nome da empresa (mínimo 2 caracteres).";
  }
  const digits = normalizeCnpjDigits(cnpjRaw);
  if (digits.length !== 14) {
    e.cnpj = "CNPJ deve ter 14 dígitos (com ou sem pontuação).";
  }
  return e;
}

export function CompanyFormPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const formId = useId();
  const isEdit = Boolean(companyId);

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoS3Key, setLogoS3Key] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<CompanyPayload>(`/api/v1/companies/${companyId}`);
        if (cancelled) return;
        setName(data.name ?? "");
        setCnpj(formatCnpjMask(normalizeCnpjDigits(data.cnpj ?? "")));
        setWebsite(data.website?.trim() ?? "");
        setDescription(data.description?.trim() ?? "");
        setLogoS3Key(data.logo_s3_key?.trim() ?? "");
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Empresa não encontrada.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate(name, cnpj);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (isEdit && companyId) {
        await apiFetch<CompanyPayload>(`/api/v1/companies/${companyId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            cnpj: formatCnpjMask(cnpj),
            website: website.trim() || null,
            description: description.trim() || null,
            logo_s3_key: logoS3Key.trim() || null,
          }),
        });
      } else {
        await apiFetch<CompanyPayload>("/api/v1/companies", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            cnpj: formatCnpjMask(cnpj),
            website: website.trim(),
            description: description.trim(),
            logo_s3_key: logoS3Key.trim() || null,
          }),
        });
      }
      navigate("/recruiter/companies", { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-gray-500">Carregando…</div>
    );
  }

  if (isEdit && loadError && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 mb-6">{loadError}</div>
        <Link to="/recruiter/companies" className="text-primary font-semibold hover:underline">
          Voltar às empresas
        </Link>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/recruiter/companies"
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {isEdit ? "Editar empresa" : "Registrar empresa"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit
              ? "Atualize os dados da empresa."
              : "Preencha os dados da empresa para começar a publicar vagas."}
          </p>
        </div>

        {submitError && !fieldErrors.name ? (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">{submitError}</div>
        ) : null}

        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Logo da empresa</h2>
            <ImageUploadField
              purpose="company_logo"
              value={logoS3Key}
              onChange={setLogoS3Key}
              disabled={saving}
              hint="JPG, PNG, GIF ou WebP. Recomendado: 200×200 px."
              variant="company"
            />
          </div>

          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Informações da empresa</h2>

            <div className="mb-4">
              <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-foreground mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                required
                minLength={2}
                maxLength={200}
              />
              {fieldErrors.name ? <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p> : null}
            </div>

            <div className="mb-4">
              <label htmlFor={`${formId}-cnpj`} className="block text-sm font-medium text-foreground mb-2">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-cnpj`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cnpj}
                onChange={(e) => setCnpj(formatCnpjMask(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono tabular-nums"
                placeholder="00.000.000/0000-00"
                required
                maxLength={18}
                spellCheck={false}
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode digitar ou colar só os 14 números; a máscara é aplicada automaticamente.
              </p>
              {fieldErrors.cnpj ? <p className="text-sm text-red-600 mt-1">{fieldErrors.cnpj}</p> : null}
            </div>

            <div className="mb-4">
              <label htmlFor={`${formId}-website`} className="block text-sm font-medium text-foreground mb-2">
                Site
              </label>
              <input
                id={`${formId}-website`}
                type="text"
                inputMode="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="https://"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-desc`} className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <textarea
                id={`${formId}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y min-h-[120px]"
                placeholder="Missão, valores, área de atuação…"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60 min-h-[48px]"
            >
              {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Registrar empresa"}
            </button>
            <Link
              to="/recruiter/companies"
              className="flex-1 text-center bg-gray-100 text-foreground font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors min-h-[48px] flex items-center justify-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
