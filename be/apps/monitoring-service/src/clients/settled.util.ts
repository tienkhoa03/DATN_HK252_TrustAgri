export function settledValue<T>(r: PromiseSettledResult<T | null>): T | null {
  return r.status === 'fulfilled' ? r.value : null;
}
