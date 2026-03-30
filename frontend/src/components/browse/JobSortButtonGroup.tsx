import { SORT_LABELS, SORT_VALUES, type SortValue } from "../../lib/jobSort";

type Props = {
  sort: SortValue;
  onSortChange: (s: SortValue) => void;
};

export function JobSortButtonGroup({ sort, onSortChange }: Props) {
  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Ordenação da lista">
      {SORT_VALUES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSortChange(s)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
            sort === s
              ? "bg-primary text-white border-primary"
              : "bg-surface text-foreground border-gray-200 hover:border-primary/40"
          }`}
        >
          {SORT_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
