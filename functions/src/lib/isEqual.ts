/** Shallow value equality for flat, plain objects (e.g. two
 * TravelStyleVectors) — enough to detect a genuine change in
 * onTravelStyleChanged without pulling in a deep-equal dependency. */
export default function isEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}
