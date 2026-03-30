import { Link } from "react-router-dom";
import { CompanyLogoPlaceholder } from "../CompanyLogoPlaceholder";

export type CompanyHeroData = {
  name: string;
  description: string;
  website: string;
  logo_s3_key?: string | null;
  active_jobs_count: number;
};

function websiteHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return t.startsWith("http") ? t : `https://${t}`;
}

export function CompanyHeroHeader({ company }: { company: CompanyHeroData }) {
  const href = company.website?.trim() ? websiteHref(company.website) : null;
  const jobsLabel =
    company.active_jobs_count === 1
      ? "1 vaga ativa"
      : `${company.active_jobs_count} vagas ativas`;

  return (
    <div className="mb-10">
      <Link
        to="/companies"
        className="inline-flex items-center text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Empresas
      </Link>

      <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <CompanyLogoPlaceholder className="w-20 h-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
            <p className="text-primary font-medium mt-2">{jobsLabel}</p>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary font-semibold text-sm mt-3 inline-block hover:underline"
              >
                {company.website?.replace(/^https?:\/\//i, "") ?? "Site"}
              </a>
            ) : null}
          </div>
        </div>
        {company.description?.trim() ? (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-foreground mb-3">Sobre</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{company.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
