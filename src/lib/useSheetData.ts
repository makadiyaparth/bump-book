/* ============================================
   Client-Side SWR Hook & Cache Invalidation
   Instant screen-to-screen navigation with
   zero-spinner caching and smart mutations.
   ============================================ */

import useSWR, { mutate } from 'swr';

export const SHEET_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to fetch sheet records');
  }
  const json = await res.json();
  return (json.data || []) as Record<string, string>[];
};

/**
 * Hook to retrieve sheet rows for a tab with client-side SWR caching.
 * Navigating between screens returns data instantly from memory.
 */
export function useSheetData<T = Record<string, string>>(tab: string | null) {
  const key = tab ? `/api/sheets/${tab}` : null;

  return useSWR<T[]>(key, defaultFetcher as unknown as (url: string) => Promise<T[]>, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    dedupingInterval: SHEET_CACHE_TTL,
    keepPreviousData: true,
  });
}

/**
 * Invalidate a specific tab in the client SWR cache and trigger a re-fetch.
 * Call this after creating, editing, or deleting a record.
 */
export function invalidateSheetTab(tab: string) {
  return mutate(`/api/sheets/${tab}`);
}

/**
 * Force-sync all sheets with Google Sheets:
 * Clears the server-side cache for this user, then instructs SWR to re-fetch active tabs.
 */
export async function syncAllSheets(): Promise<boolean> {
  try {
    const res = await fetch('/api/sheets/sync', { method: 'POST' });
    if (!res.ok) throw new Error('Sync failed');

    // Revalidate all active SWR keys matching /api/sheets
    await mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/sheets')
    );
    return true;
  } catch (err) {
    console.error('Error syncing sheets:', err);
    return false;
  }
}

/**
 * Wipe all cached sheet rows from browser memory (e.g. on logout).
 */
export function clearClientSheetCache() {
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/sheets'),
    undefined,
    { revalidate: false }
  );
}
