// useLocalSearchParams returns string | string[] | undefined per param. We
// always want the first match — repeated keys aren't a thing the app emits.
export function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
