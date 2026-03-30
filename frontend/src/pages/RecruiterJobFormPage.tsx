import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

type CompanyOption = { id: number; name: string };
type JobDetail = {
  id: number;
  title: string;
  description: string;
  requirements: string;
  salary_range: string;
  is_active: boolean;
  company: { id: number; name: string };
  tags: string[];
};

function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function RecruiterJobFormPage() {
  const { companyId: companyIdParam, jobId } = useParams<{ companyId?: string; jobId?: string }>();
  const navigate = useNavigate();
  const formId = useId();
  const safeFormId = formId.replace(/:/g, "");

  const isEdit = Boolean(jobId);
  const fixedCompanyId = companyIdParam ? Number(companyIdParam) : NaN;
  const needsCompanyPicker = !isEdit && !companyIdParam;

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [fixedCompanyName, setFixedCompanyName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const effectiveCompanyId = useMemo(() => {
    if (isEdit) return null;
    if (!Number.isNaN(fixedCompanyId)) return fixedCompanyId;
    if (selectedCompanyId === "") return null;
    return selectedCompanyId;
  }, [isEdit, fixedCompanyId, selectedCompanyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<Array<{ name: string }>>(`/api/v1/tags?limit=80`);
        if (!cancelled) setTagSuggestions(res.map((t) => t.name).filter(Boolean));
      } catch {
        if (!cancelled) setTagSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!companyIdParam || isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await apiFetch<{ id: number; name: string }>(`/api/v1/companies/${companyIdParam}`);
        if (!cancelled) {
          setFixedCompanyName(c.name ?? "");
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Empresa não encontrada.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyIdParam, isEdit]);

  useEffect(() => {
    if (!needsCompanyPicker) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ companies: { id: number; name: string }[] }>("/api/v1/companies/mine");
        const list = res.companies ?? [];
        if (!cancelled) {
          setCompanies(list.map((c) => ({ id: c.id, name: c.name })));
          if (list.length === 1) setSelectedCompanyId(list[0].id);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Erro ao carregar empresas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsCompanyPicker]);

  useEffect(() => {
    if (!isEdit || !jobId) return;
    let cancelled = false;
    (async () => {
      try {
        const j = await apiFetch<JobDetail>(`/api/v1/jobs/${jobId}`);
        if (cancelled) return;
        setTitle(j.title ?? "");
        setDescription(j.description ?? "");
        setRequirements(j.requirements ?? "");
        setSalaryRange(j.salary_range ?? "");
        setTagsInput((j.tags ?? []).join(", "));
        setIsActive(j.is_active ?? true);
        setFixedCompanyName(j.company?.name ?? "");
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Vaga não encontrada.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, jobId]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) {
      e.title = "Informe o título da vaga (mínimo 2 caracteres).";
    }
    if (!description.trim()) {
      e.description = "Informe a descrição da vaga.";
    }
    if (!isEdit && effectiveCompanyId == null) {
      e.company = "Selecione a empresa.";
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const tags = parseTagsInput(tagsInput);
    setSaving(true);
    try {
      if (isEdit && jobId) {
        await apiFetch<JobDetail>(`/api/v1/recruiter/jobs/${jobId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            requirements: requirements.trim(),
            salary_range: salaryRange.trim(),
            is_active: isActive,
            tags,
          }),
        });
      } else if (effectiveCompanyId != null) {
        await apiFetch<{ id: number }>(`/api/v1/recruiter/jobs/companies/${effectiveCompanyId}`, {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            requirements: requirements.trim(),
            salary_range: salaryRange.trim(),
            is_active: isActive,
            tags,
          }),
        });
      }
      navigate("/recruiter/jobs", { replace: true });
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

  if (loadError && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 mb-6">{loadError}</div>
        <Link to="/recruiter/jobs" className="text-primary font-semibold hover:underline">
          Voltar às vagas
        </Link>
      </div>
    );
  }

  if (needsCompanyPicker && companies.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-surface rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-foreground mb-4">Cadastre uma empresa antes de publicar vagas.</p>
          <Link to="/recruiter/companies/new" className="text-primary font-semibold hover:underline">
            Registrar empresa
          </Link>
        </div>
      </div>
    );
  }

  const cancelHref = "/recruiter/jobs";

  return (
    <section className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to={cancelHref}
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {isEdit ? "Editar vaga" : "Publicar vaga"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit
              ? "Atualize os dados da vaga."
              : "Preencha os detalhes da vaga para encontrar o candidato ideal."}
          </p>
        </div>

        {submitError ? (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">{submitError}</div>
        ) : null}

        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Empresa</h2>
            {isEdit ? (
              <p className="text-sm text-foreground">
                <span className="text-gray-500">Publicando como </span>
                <span className="font-semibold">{fixedCompanyName || "—"}</span>
              </p>
            ) : needsCompanyPicker ? (
              <div>
                <label htmlFor={`${formId}-company`} className="block text-sm font-medium text-foreground mb-2">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <select
                  id={`${formId}-company`}
                  value={selectedCompanyId === "" ? "" : String(selectedCompanyId)}
                  onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                >
                  <option value="">Selecione a empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecione a empresa que está publicando a vaga.</p>
                {fieldErrors.company ? <p className="text-sm text-red-600 mt-1">{fieldErrors.company}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-foreground">
                <span className="text-gray-500">Empresa: </span>
                <span className="font-semibold">{fixedCompanyName}</span>
              </p>
            )}
          </div>

          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Detalhes da vaga</h2>

            <div className="mb-4">
              <label htmlFor={`${formId}-title`} className="block text-sm font-medium text-foreground mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-title`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                maxLength={200}
                required
              />
              {fieldErrors.title ? <p className="text-sm text-red-600 mt-1">{fieldErrors.title}</p> : null}
            </div>

            <div className="mb-4">
              <label htmlFor={`${formId}-desc`} className="block text-sm font-medium text-foreground mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id={`${formId}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y min-h-[140px]"
                placeholder="Responsabilidades, atividades e o que você espera do profissional."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Descreva as responsabilidades, o dia a dia e o perfil desejado.
              </p>
              {fieldErrors.description ? (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.description}</p>
              ) : null}
            </div>

            <div className="mb-4">
              <label htmlFor={`${formId}-req`} className="block text-sm font-medium text-foreground mb-2">
                Requisitos
              </label>
              <textarea
                id={`${formId}-req`}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y min-h-[100px]"
                placeholder="Stack, experiência, formação, soft skills…"
              />
              <p className="text-xs text-gray-500 mt-1">
                Liste requisitos técnicos, experiência desejada e habilidades comportamentais.
              </p>
            </div>

            <div>
              <label htmlFor={`${formId}-salary`} className="block text-sm font-medium text-foreground mb-2">
                Faixa salarial
              </label>
              <input
                id={`${formId}-salary`}
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="Ex.: R$ 8.000 – 12.000 CLT"
              />
              <p className="text-xs text-gray-500 mt-1">Opcional. Vagas com faixa salarial costumam atrair mais candidatos.</p>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Tecnologias</h2>
            <label htmlFor={`${formId}-tags`} className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              id={`${formId}-tags`}
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              list={`${safeFormId}-taglist`}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-foreground bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              placeholder="Ex.: Python, Django, PostgreSQL, Docker"
              autoComplete="off"
            />
            <datalist id={`${safeFormId}-taglist`}>
              {tagSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">Separe por vírgula. Novas tags serão criadas ao salvar.</p>
          </div>

          <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">Status</h2>
            <div className="flex items-start gap-3">
              <input
                id={`${formId}-active`}
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor={`${formId}-active`} className="text-sm font-medium text-foreground">
                Vaga ativa (visível na busca pública)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Desmarque para manter como rascunho sem publicar.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60 min-h-[48px]"
            >
              {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Publicar vaga"}
            </button>
            <Link
              to={cancelHref}
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
