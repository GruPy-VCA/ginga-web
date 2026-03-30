import { useNavigate } from "react-router-dom";
import { CompanyLogoImage } from "../CompanyLogoImage";

export type PublicCompanySummary = {
  id: number;
  name: string;
  website?: string | null;
  logo_s3_key?: string | null;
  active_jobs_count: number;
};

function websiteHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.startsWith("http") ? t : `https://${t}`;
}

export function CompanyDirectoryRow({ company }: { company: PublicCompanySummary }) {
  const navigate = useNavigate();
  const href = company.website?.trim() ? websiteHref(company.website) : null;
  const jobsLabel =
    company.active_jobs_count === 1
      ? "1 vaga disponível"
      : `${company.active_jobs_count} vagas disponíveis`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/companies/${company.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/companies/${company.id}`);
        }
      }}
      className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <CompanyLogoImage s3Key={company.logo_s3_key} className="w-14 h-14" alt={company.name} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg">{company.name}</h3>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-secondary font-medium hover:underline mt-1 inline-block truncate max-w-full"
              >
                {company.website?.replace(/^https?:\/\//i, "") ?? href}
              </a>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Site não informado</p>
            )}
            <p className="text-sm text-primary font-semibold mt-2">{jobsLabel}</p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full shrink-0">
          Ver empresa →
        </span>
      </div>
    </div>
  );
}
