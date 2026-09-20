// R3 display: when the repository is shown, and under which name (ADR-0007). Pure.

/** The repository is shown from the moment two repositories have ever reported, and then for good. */
export function showRepository(repositoryCount: number): boolean {
  return repositoryCount >= 2;
}

function segments(key: string): string[] {
  return key.split('/').filter((s) => s !== '');
}

/**
 * The short name of a repository, disambiguated only where it has to be:
 * one segment -> itself; unique last segment -> that; unique last two -> `owner/repo`; else the key.
 */
export function repositoryLabel(key: string, allKeys: readonly string[]): string {
  const segs = segments(key);
  if (segs.length === 0) return key;
  if (segs.length === 1) return segs[0]!;
  const others = [...new Set(allKeys)].filter((k) => k !== key).map(segments);
  const last = segs[segs.length - 1]!;
  if (!others.some((o) => o[o.length - 1] === last)) return last;
  const lastTwo = segs.slice(-2).join('/');
  if (!others.some((o) => o.length >= 2 && o.slice(-2).join('/') === lastTwo)) return lastTwo;
  return key;
}

export interface RepositoryView {
  show: boolean;
  labelOf: (projectKey: string) => string;
}

/** One value per request, so a ticket shows the same label on every tab. */
export function repositoryView(allKeys: readonly string[]): RepositoryView {
  const labels = new Map<string, string>();
  for (const key of allKeys) labels.set(key, repositoryLabel(key, allKeys));
  return {
    show: showRepository(new Set(allKeys).size),
    labelOf: (key) => labels.get(key) ?? repositoryLabel(key, allKeys),
  };
}
