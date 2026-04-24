import { getConfig } from '@/lib/runtimeConfig';

const rawAuthApiBaseURL = getConfig().authApiUrl || getConfig().apiUrl;

const authOrigin = rawAuthApiBaseURL.replace(/\/api\/v\d+$/i, '').replace(/\/$/, '');

export const normalizeAvatarUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http') || trimmed.startsWith('//')) {
    return trimmed;
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${authOrigin}${trimmed}`;
  }

  return `${authOrigin}/${trimmed}`;
};
