const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

function normalizeApiBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('NEXT_PUBLIC_API_URL must use http or https');
    }
    return url.origin;
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be a valid absolute URL, for example https://api.example.com');
  }
}

const fallbackApiUrl = 'http://localhost:5000';
const resolvedApiUrl = rawApiUrl?.trim();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !resolvedApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required in production');
}

export const API_BASE_URL = normalizeApiBaseUrl(resolvedApiUrl || fallbackApiUrl);
