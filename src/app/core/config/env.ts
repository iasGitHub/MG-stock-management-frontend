import { environment } from '../../../environments/environment';

export interface AppEnv {
  apiUrl: string;
}

function normalizeApiUrl(base: string): string {
  const url = base.replace(/\/+$/, '');
  if (url.endsWith('/api')) {
    return url;
  }
  return `${url}/api`;
}

function resolveApiUrl(): string {
  const fromWindow = (window as any)?.API_URL;
  if (typeof fromWindow === 'string' && fromWindow.trim() !== '') {
    return normalizeApiUrl(fromWindow);
  }
  return environment.apiUrl;
}

export const appEnv: AppEnv = {
  apiUrl: resolveApiUrl(),
};
