/**
 * A simple left-to-right architecture strip: <Flow nodes={["Client", "LB", "App", "DB"]} labels={["HTTPS", "", "SQL"]} />
 * `labels[i]` annotates the arrow between nodes[i] and nodes[i + 1].
 */
export function Flow({ nodes, labels = [], caption }: { nodes: string[]; labels?: string[]; caption?: string }) {
  return (
    <figure className="not-prose my-6">
      <div className="flex flex-wrap items-center justify-center gap-y-3 rounded-2xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-800 dark:bg-ink-900/50">
        {nodes.map((n, i) => (
          <div key={n + i} className="flex items-center">
            <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-center text-sm font-medium shadow-sm dark:border-ink-700 dark:bg-ink-800">
              {n}
            </div>
            {i < nodes.length - 1 && (
              <div className="flex min-w-14 flex-col items-center px-1 text-ink-400">
                <span className="text-[10px] leading-none text-ink-500">{labels[i] ?? ""}</span>
                <span aria-hidden className="text-brand-400">⟶</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {caption && <figcaption className="mt-2 text-center text-xs text-ink-500">{caption}</figcaption>}
    </figure>
  );
}
