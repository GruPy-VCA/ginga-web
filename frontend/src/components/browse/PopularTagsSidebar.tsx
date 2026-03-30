type TagItem = { name: string };

type Props = {
  tags: TagItem[];
  tag: string;
  onSelectTag: (name: string) => void;
  onClearTag: () => void;
};

export function PopularTagsSidebar({ tags, tag, onSelectTag, onClearTag }: Props) {
  return (
    <div className="bg-surface rounded-xl shadow-[var(--shadow-soft)] p-6 border border-gray-100">
      <h3 className="font-semibold text-foreground mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        Tecnologias populares
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma tag disponível</p>
        ) : (
          tags.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => onSelectTag(t.name)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                tag === t.name ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {t.name}
            </button>
          ))
        )}
      </div>
      {tag ? (
        <button
          type="button"
          onClick={onClearTag}
          className="inline-flex items-center mt-4 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpar filtro
        </button>
      ) : null}
    </div>
  );
}
