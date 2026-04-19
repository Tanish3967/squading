

## Goal
Make the "Continue" tap (phone-number lookup) on the Login screen feel near-instant.

## Where the time actually goes
The DB query itself is already fast (`profiles.phone` has both a UNIQUE constraint and a btree index — sub-millisecond). The latency the user feels is from:

1. **Edge function cold boot** (~25–35 ms when cold, plus ~50–100 ms TLS+routing on first call from a session).
2. **Two sequential round-trips for new/incomplete users** — `check-phone` then `register`/`resetup` runs back-to-back, doubling perceived wait.
3. **No optimistic UI** — button shows "Checking…" spinner for the whole network round-trip with no progress.
4. **Admin client created on every invocation** inside `getAdminClient()` — minor, but adds ~5–10 ms.
5. **Bypass-phone path does extra writes** (auto-create / update `totp_enabled`) before responding — runs serially even when not needed.

## Plan

### 1. Collapse two round-trips into one (biggest win)
Change `check-phone` to also return TOTP setup data when the user is new or hasn't completed setup. The client then skips the second `register`/`resetup` call.

- New response shape:
  ```
  { exists, totp_enabled, user_id?, totp_secret?, otpauth_uri? }
  ```
- For existing-with-TOTP users → unchanged (just `exists:true, totp_enabled:true`).
- For new users → `check-phone` internally calls the same setup logic and returns the QR data in one shot.
- For existing-without-TOTP → same, returns fresh secret immediately.
- Update `LoginScreen.handlePhoneNext` to use the combined response (no second await).

**Impact**: Eliminates one full edge round-trip (~150–300 ms saved on new-user / re-setup flow).

### 2. Warm-prefetch on phone-input focus
Fire a lightweight no-op to the auth function as soon as the user focuses the phone input (or types the first digit). This pays the cold-boot cost in the background while they're still typing 10 digits.

- Add a tiny `GET /auth/ping` route that returns `{ok:true}` (no DB).
- Call it once from `LoginScreen` on input focus, fire-and-forget.

**Impact**: By the time they hit Continue, the function is already warm — saves the ~30–80 ms boot time.

### 3. Module-level admin client (micro-optimization)
Move `createClient(...)` to module scope so it's reused across warm invocations instead of recreated per request.

### 4. Defer bypass-phone side effects
For the hardcoded test phones, return the response first; do the auto-create / `totp_enabled` update via `EdgeRuntime.waitUntil(...)` so the response is sent immediately.

### 5. Optimistic UX polish
- Disable the "Continue" button only after 200 ms (avoid spinner flash for warm calls).
- Pre-render the QR-setup screen shell (skeleton) the moment the request fires, so when the response arrives the QR slots in instantly.

## Files to change
- `supabase/functions/auth/index.ts` — combined check-phone response, `/ping` route, module-scope client, deferred bypass writes.
- `src/lib/auth-api.ts` — add `pingAuth()`; `checkPhone` returns enriched payload.
- `src/pages/LoginScreen.tsx` — call `pingAuth()` on phone-input focus; skip the second call when QR data is already present in `checkPhone` response; add deferred-spinner UX.

## Out of scope (already optimal)
- DB index on `profiles.phone` — already exists.
- Switching off `verify_jwt` — already off for this function.

## Expected result
Cold-state Continue tap: **~400–600 ms → ~100–180 ms** for new users; warm tap: near-instant (<80 ms perceived).

