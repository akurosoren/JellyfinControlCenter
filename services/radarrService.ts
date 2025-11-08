import { RadarrSettings, RadarrMovie } from '../types';

async function apiFetch(endpoint: string, settings: RadarrSettings, options: RequestInit = {}) {
  const { url, apiKey } = settings;
  if (!url || !apiKey) {
    throw new Error("Radarr URL or API Key is not configured.");
  }

  const headers = {
    'Accept': 'application/json',
    'X-Api-Key': apiKey,
    ...options.headers,
  };

  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${cleanUrl}${cleanEndpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Radarr API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Radarr API call to ${endpoint} failed:`, error);
    if (error instanceof TypeError) {
        throw new Error("Network Error: Could not connect to the Radarr server. This may be a CORS issue, which typically needs to be configured in your reverse proxy (like Nginx or Caddy). Please ensure your reverse proxy is set up to add the necessary CORS headers for this application's domain.");
    }
    throw error;
  }
}

export const getRadarrMovies = async (settings: RadarrSettings): Promise<RadarrMovie[]> => {
    return apiFetch('/api/v3/movie', settings);
};

export const deleteRadarrMovie = async (settings: RadarrSettings, movieId: number): Promise<void> => {
    await apiFetch(`/api/v3/movie/${movieId}?deleteFiles=true&addImportExclusion=false`, settings, { method: 'DELETE' });
};

export const testRadarrConnection = async (settings: RadarrSettings): Promise<{ appName: string }> => {
    return apiFetch('/api/v3/system/status', settings);
}