import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { BrowsePageShell } from "../components/browse/BrowsePageShell";
import { CompanyHeroHeader, type CompanyHeroData } from "../components/browse/CompanyHeroHeader";
import { PublicJobListSection } from "../components/browse/PublicJobListSection";

export function CompanyPublicDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const id = Number(companyId);
  const invalid = !companyId || Number.isNaN(id);

  const [data, setData] = useState<CompanyHeroData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!invalid);

  useEffect(() => {
    if (invalid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<CompanyHeroData>(`/api/v1/companies/public/${id}`);
        if (!cancelled) {
          setData(res);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Empresa não encontrada");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, invalid]);

  if (invalid) {
    return (
      <BrowsePageShell>
        <p className="text-red-800">Empresa inválida.</p>
        <Link to="/companies" className="text-primary font-semibold mt-4 inline-block">
          Voltar ao diretório
        </Link>
      </BrowsePageShell>
    );
  }

  if (loading) {
    return (
      <BrowsePageShell>
        <p className="text-gray-500">Carregando…</p>
      </BrowsePageShell>
    );
  }

  if (err || !data) {
    return (
      <BrowsePageShell>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 mb-6">{err ?? "Não encontrado."}</div>
        <Link to="/companies" className="text-primary font-semibold hover:underline">
          Voltar ao diretório
        </Link>
      </BrowsePageShell>
    );
  }

  return (
    <BrowsePageShell>
      <CompanyHeroHeader company={data} />
      <PublicJobListSection companyId={id} headingLevel="section" title="Vagas abertas" />
    </BrowsePageShell>
  );
}
