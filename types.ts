export interface JellyfinSettings {
  url: string;
  apiKey: string;
  userId: string;
}

export interface RadarrSettings {
  url: string;
  apiKey: string;
}

export interface SonarrSettings {
  url: string;
  apiKey: string;
}

export interface AutomationSettings {
  movieRetentionDays: number;
  tvSeasonRetentionDays: number;
}

export interface JccSettings {
  jellyfin: JellyfinSettings;
  radarr?: RadarrSettings;
  sonarr?: SonarrSettings;
  automation?: AutomationSettings;
}

export interface JellyfinUser {
  Name: string;
  Id: string;
  PrimaryImageTag?: string;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: 'Movie' | 'Series' | 'Season' | 'Episode';
  DateCreated: string; // ISO date string
  SeriesName?: string;
  SeriesId?: string;
  ParentId?: string;
  ImageTags?: {
    Primary?: string;
  }
  ProductionYear?: number;
  ProviderIds?: {
    Tmdb?: string;
    Tvdb?: string;
    Imdb?: string;
  }
}

export interface RadarrMovie {
    id: number;
    title: string;
    year: number;
    tmdbId: number;
    path: string;
}

export interface SonarrSeries {
    id: number;
    title: string;
    tvdbId: number;
    path: string;
    images: { coverType: string, url: string }[];
}

export interface SonarrEpisode {
    id: number;
    seriesId: number;
    episodeNumber: number;
    seasonNumber: number;
    title: string;
    hasFile: boolean;
    episodeFileId: number;
}

export interface SonarrCalendarItem {
    seriesId: number;
    tvdbId: number;
    title: string;
    seasonNumber: number;
    episodeNumber: number;
    airDateUtc: string;
    series: {
        title: string;
        tvdbId: number;
        images: { coverType: string, remoteUrl: string }[];
    }
}