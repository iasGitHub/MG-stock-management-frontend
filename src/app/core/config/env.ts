import { environment } from '../../../environments/environment';

export interface AppEnv {
  apiUrl: string;
}

function resolveApiUrl(): string {
  const fromWindow = (window as any)?.API_URL;
  if (typeof fromWindow === 'string' && fromWindow.trim() !== '') {
    return fromWindow.replace(/\/+$/, '');
  }
  return environment.apiUrl;
}

export const appEnv: AppEnv = {
  apiUrl: resolveApiUrl(),
};
