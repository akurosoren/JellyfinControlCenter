import { JellyfinSettings, JellyfinItem, JellyfinUser } from '../types';

async function apiFetch(endpoint: string, settings: Omit<JellyfinSettings, 'userId'>, options: RequestInit = {}) {
  const { url, apiKey } = settings;
  if (!url || !apiKey) {
    throw new Error("Jellyfin URL or API Key is not configured.");
  }

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'X-Emby-Token': apiKey,
    ...options.headers,
  };
    
  if (options.method === 'POST') {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
  }

  // Ensure URL doesn't have trailing slash and endpoint has leading slash
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${cleanUrl}${cleanEndpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    if (response.status === 204) { // No Content for DELETE or POST success
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Jellyfin API call to ${endpoint} failed:`, error);
    if (error instanceof TypeError) {
        throw new Error("Network Error: Could not connect to the Jellyfin server. This is likely a CORS issue. Please go to your Jellyfin Dashboard > Networking, and in the 'CORS origins' field, add the URL of this application. Using '*' will allow all origins.");
    }
    throw error;
  }
}

export const getJellyfinUsers = async (settings: Omit<JellyfinSettings, 'userId'>): Promise<JellyfinUser[]> => {
  return apiFetch('/Users', settings);
};

export const getItems = async (settings: JellyfinSettings, itemTypes: string[], limit?: number): Promise<JellyfinItem[]> => {
  const params = new URLSearchParams({
    Recursive: 'true',
    IncludeItemTypes: itemTypes.join(','),
    Fields: 'DateCreated,SeriesInfo,ParentId,ProductionYear,ProviderIds,SeriesId',
    SortBy: 'DateCreated',
    SortOrder: 'Descending',
  });
  if (limit) {
    params.append('Limit', String(limit));
  }
  const data = await apiFetch(`/Users/${settings.userId}/Items?${params.toString()}`, settings);
  return data?.Items || [];
};

export const getItemsByIds = async (settings: JellyfinSettings, ids: string[]): Promise<JellyfinItem[]> => {
  if (ids.length === 0) {
    return [];
  }

  const BATCH_SIZE = 50; // Process IDs in chunks to avoid URL length limits
  const batches: string[][] = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }

  const batchPromises = batches.map(async (batchOfIds) => {
    const params = new URLSearchParams({
      Recursive: 'true',
      Ids: batchOfIds.join(','),
      Fields: 'DateCreated,SeriesInfo,ParentId,ProductionYear,ProviderIds,SeriesId',
    });
    
    const data = await apiFetch(`/Users/${settings.userId}/Items?${params.toString()}`, settings);
    return data?.Items || [];
  });

  const results = await Promise.all(batchPromises);
  return results.flat();
};


export const deleteItem = async (settings: JellyfinSettings, itemId: string): Promise<void> => {
  await apiFetch(`/Items/${itemId}`, settings, { method: 'DELETE' });
};

export const getImageUrl = (settings: JellyfinSettings, item: JellyfinItem): string => {
    const { url } = settings;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    if (item.ImageTags && item.ImageTags.Primary) {
        return `${cleanUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&maxWidth=400`;
    }
    return 'https://via.placeholder.com/200x300.png?text=No+Image';
}