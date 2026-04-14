// TODO: implement API utilities

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries?: number,
): Promise<Response> {
  // TODO: implement retry logic with exponential backoff
  return fetch(url, options);
}

export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
