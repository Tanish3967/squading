import { supabase } from "@/integrations/supabase/client";

export interface CachedContact {
  id: string;
  name: string;
  phone: string;
}

let inFlight: Promise<CachedContact[]> | null = null;
let cached: CachedContact[] | null = null;
let cachedForUserId: string | null = null;

/**
 * Prefetch / get the current user's contacts.
 * - Reuses an in-flight request if one is already running (no double-fetch).
 * - Returns a resolved cache instantly on subsequent calls.
 * - Auto-invalidates when the user changes.
 *
 * Safe to call as fire-and-forget for warm-up (e.g. on Home mount),
 * and again with `await` from the consumer screen.
 */
export function prefetchContacts(userId: string | undefined): Promise<CachedContact[]> {
  if (!userId) return Promise.resolve([]);

  if (cachedForUserId !== userId) {
    cached = null;
    inFlight = null;
    cachedForUserId = userId;
  }

  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .order("name");
      cached = (data as CachedContact[]) || [];
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Manually update the cache (e.g. after a Quick Add). */
export function updateContactsCache(updater: (prev: CachedContact[]) => CachedContact[]) {
  if (cached) cached = updater(cached);
}

/** Clear the cache (e.g. on sign-out). */
export function clearContactsCache() {
  cached = null;
  inFlight = null;
  cachedForUserId = null;
}
