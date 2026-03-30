import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { normalizeSort, SORT_LABELS, type SortValue } from "../../lib/jobSort";
import { BrowseGrid } from "./BrowseGrid";
import { JobResultRow, type JobSummary } from "./JobResultRow";
import { JobSortButtonGroup } from "./JobSortButtonGroup";
import { ListPaginationControls } from "./ListPaginationControls";
import { PopularTagsSidebar } from "./PopularTagsSidebar";
import { SidebarSearchCard } from "./SidebarSearchCard";

type ListResponse = {
  results: JobSummary[];
  total: number;
  page: number;
  page_size: number;
};

type Props = {
  companyId?: number;
  title?: string;
  subtitleHint?: string;
  /** `page` = h1 grande (listagem /jobs); `section` = h2 (bloco na página da empresa). */
  headingLevel?: "page" | "section";
};

export function PublicJobListSection({
  companyId,
  title = "Vagas disponíveis",
  subtitleHint,
  headingLevel = "section",
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const sort = normalizeSort(searchParams.get("sort"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [tags, setTags] = useState<{ name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQ, setLocalQ] = useState(q);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      if (sort !== "recent") params.set("sort", sort);
      if (companyId != null) params.set("company_id", String(companyId));
      params.set("page", String(page));
      params.set("page_size", "12");
      const qs = params.toString();
      const [listRes, tagRes] = await Promise.all([
        apiFetch<ListResponse>(`/api/v1/jobs?${qs}`),
        apiFetch<{ name: string }[]>(`/api/v1/tags?limit=40`),
      ]);
      setData(listRes);
      setTags(tagRes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar vagas");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, tag, sort, page, companyId]);

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
    if (tag) next.set("tag", tag);
    if (sort !== "recent") next.set("sort", sort);
    next.set("page", "1");
    setSearchParams(next);
  }

  function setSort(nextSort: SortValue) {
    const next = new URLSearchParams(searchParams);
    if (nextSort === "recent") next.delete("sort");
    else next.set("sort", nextSort);
    next.set("page", "1");
    setSearchParams(next);
  }

  const total = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const emptyResetHref = companyId != null ? `/companies/${companyId}` : "/jobs";

  const HeadingTag = headingLevel === "page" ? "h1" : "h2";
  const headingClass =
    headingLevel === "page" ? "text-3xl font-bold text-foreground" : "text-2xl font-bold text-foreground";

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <HeadingTag className={headingClass}>{title}</HeadingTag>
          <p className="text-gray-600 mt-1">
            {total} vaga{total === 1 ? "" : "s"} encontrada{total === 1 ? "" : "s"}
            {q ? ` para “${q}”` : ""}
            {tag ? ` com a tag “${tag}”` : ""}
            {subtitleHint ? <span className="text-foreground/80"> · {subtitleHint}</span> : null}
            {sort !== "recent" ? <span className="text-foreground/80"> · {SORT_LABELS[sort]}</span> : null}
          </p>
          <JobSortButtonGroup sort={sort} onSortChange={setSort} />
        </div>
      </div>

      <BrowseGrid
        sidebar={
          <>
            <SidebarSearchCard
              localQ={localQ}
              onLocalQChange={setLocalQ}
              onSubmit={submitSearch}
              placeholder={
                companyId != null ? "Buscar entre as vagas desta empresa…" : "Cargo, empresa ou tecnologia…"
              }
            />
            <PopularTagsSidebar
              tags={tags}
              tag={tag}
              onSelectTag={(name) => {
                const next = new URLSearchParams();
                if (q) next.set("q", q);
                next.set("tag", name);
                if (sort !== "recent") next.set("sort", sort);
                next.set("page", "1");
                setSearchParams(next);
              }}
              onClearTag={() => {
                const next = new URLSearchParams();
                if (q) next.set("q", q);
                if (sort !== "recent") next.set("sort", sort);
                next.set("page", "1");
                setSearchParams(next);
              }}
            />
          </>
        }
      >
        {loading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : err ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">{err}</div>
        ) : !data?.results.length ? (
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-500 mb-6">
              {sort === "recommended"
                ? "Nenhuma vaga combina com suas competências e requisitos, ou ajuste a busca. Complete o campo de competências no perfil para melhorar as recomendações."
                : q || tag
                  ? "Tente ajustar seus filtros de busca."
                  : companyId != null
                    ? "Esta empresa não tem vagas ativas no momento."
                    : "No momento não há vagas disponíveis."}
            </p>
            {(q || tag || sort !== "recent" || companyId != null) && (
              <Link
                to={emptyResetHref}
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
              >
                {companyId != null ? "Limpar filtros desta empresa" : "Ver todas as vagas"}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.results.map((job) => (
                <JobResultRow key={job.id} job={job} />
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
    </>
  );
}
