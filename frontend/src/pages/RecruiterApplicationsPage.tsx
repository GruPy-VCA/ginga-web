import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatTimeAgo } from "../lib/time";
import { applicationStatusClasses, applicationStatusLabel } from "../lib/jobStatus";

type RecruiterAppRow = {
  id: number;
  status: string;
  applied_at?: string | null;
  cover_letter: string;
  feedback_text?: string | null;
  candidate: { id: string; email: string; display_name: string };
  job: {
    id: number;
    title: string;
    company: { id: number; name: string };
  };
};

const STATUS_OPTIONS = ["applied", "interviewing", "approved", "rejected"] as const;

export function RecruiterApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [rows, setRows] = useState<RecruiterAppRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", "20");
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch<{ results: RecruiterAppRow[]; total: number; page_size: number }>(
        `/api/v1/recruiter/applications?${params.toString()}`,
      );
      setRows(res.results ?? []);
      setTotal(res.total ?? 0);
      setPageSize(res.page_size ?? 20);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar candidaturas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatusFilter(next: string) {
    const p = new URLSearchParams(searchParams);
    if (next) p.set("status", next);
    else p.delete("status");
    p.set("page", "1");
    setSearchParams(p);
  }

  async function patchStatus(id: number, status: string, feedback: string) {
    setUpdatingId(id);
    setErr(null);
    try {
      await apiFetch(`/api/v1/recruiter/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, feedback_text: feedback }),
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível atualizar");
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Candidaturas</h2>
        <p className="text-gray-600 text-sm mt-1">Filtre por status e atualize o andamento das inscrições.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <label className="text-sm text-gray-600">
          Status:{" "}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-xl border border-gray-200 px-3 py-2 text-foreground bg-background"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {applicationStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-gray-500">{total} registro{total === 1 ? "" : "s"}</span>
      </div>

      {err ? <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div> : null}

      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="bg-background rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          Nenhuma candidatura encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-surface shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-background/80">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidato</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vaga</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Empresa</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Recebida</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 min-w-[200px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ApplicationRowEditor
                  key={row.id}
                  row={row}
                  disabled={updatingId === row.id}
                  onSave={(status, feedback) => void patchStatus(row.id, status, feedback)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set("page", String(page - 1));
              setSearchParams(p);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set("page", String(page + 1));
              setSearchParams(p);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationRowEditor({
  row,
  disabled,
  onSave,
}: {
  row: RecruiterAppRow;
  disabled: boolean;
  onSave: (status: string, feedback: string) => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [feedback, setFeedback] = useState(row.feedback_text ?? "");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setStatus(row.status);
    setFeedback(row.feedback_text ?? "");
  }, [row.status, row.feedback_text, row.id]);

  const dirty = status !== row.status || feedback.trim() !== (row.feedback_text ?? "").trim();

  return (
    <>
      <tr className="border-b border-gray-50 align-top">
        <td className="py-3 px-4">
          <p className="font-medium text-foreground">{row.candidate.display_name}</p>
          <p className="text-xs text-gray-500 truncate max-w-[180px]">{row.candidate.email}</p>
        </td>
        <td className="py-3 px-4">
          <Link to={`/jobs/${row.job.id}`} className="font-medium text-primary hover:underline">
            {row.job.title}
          </Link>
        </td>
        <td className="py-3 px-4 text-gray-700">{row.job.company.name}</td>
        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatTimeAgo(row.applied_at)}</td>
        <td className="py-3 px-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${applicationStatusClasses(row.status)}`}>
                {applicationStatusLabel(row.status)}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-primary font-medium hover:underline"
              >
                {expanded ? "Ocultar" : "Gerenciar"}
              </button>
            </div>
            {expanded ? (
              <div className="rounded-lg border border-gray-100 bg-background p-3 space-y-2">
                {row.cover_letter ? (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Carta: </span>
                    {row.cover_letter}
                  </p>
                ) : null}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-foreground text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {applicationStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={disabled}
                  placeholder="Feedback ao candidato (opcional)"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-foreground text-xs resize-y"
                />
                <button
                  type="button"
                  disabled={disabled || !dirty}
                  onClick={() => onSave(status, feedback)}
                  className="text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg disabled:opacity-40"
                >
                  {disabled ? "Salvando…" : "Salvar"}
                </button>
              </div>
            ) : null}
          </div>
        </td>
      </tr>
    </>
  );
}
