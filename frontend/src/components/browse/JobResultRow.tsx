import { Link } from "react-router-dom";
import { formatTimeAgo } from "../../lib/time";
import { CompanyLogoPlaceholder } from "../CompanyLogoPlaceholder";

export type JobSummary = {
  id: number;
  title: string;
  salary_range?: string | null;
  created_at?: string | null;
  company: { id: number; name: string };
  tags: string[];
};

export function JobResultRow({ job }: { job: JobSummary }) {
  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <CompanyLogoPlaceholder className="w-14 h-14" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-lg hover:text-primary transition-colors">{job.title}</h3>
              <p className="text-gray-600">{job.company.name}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {job.salary_range ? (
                  <span className="inline-flex items-center text-sm text-primary font-medium">{job.salary_range}</span>
                ) : null}
                <span className="text-sm text-gray-400">{formatTimeAgo(job.created_at)}</span>
              </div>
              {job.tags?.length ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {job.tags.slice(0, 6).map((t) => (
                    <span key={t} className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                      {t}
                    </span>
                  ))}
                  {job.tags.length > 6 ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{job.tags.length - 6}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full shrink-0">
            Ver vaga →
          </span>
        </div>
      </div>
    </Link>
  );
}
