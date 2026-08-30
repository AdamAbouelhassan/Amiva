/**
 * React Query v5 throws "Query data cannot be undefined" if a `queryFn`
 * ever resolves to `undefined` (v4 allowed it silently) — but our
 * repositories use `T | undefined` as the "not found" convention (e.g.
 * UserRepository.getById returning undefined before onboarding creates a
 * profile doc). Wrap any queryFn whose repository call can legitimately
 * resolve to `undefined` with this at the query boundary; consuming code
 * can keep checking falsiness (`!data`) exactly as before, since `null`
 * and `undefined` are equally falsy.
 */
export function orNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}
