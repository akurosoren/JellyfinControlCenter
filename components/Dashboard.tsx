import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../App';
import { getItems, getImageUrl } from '../services/jellyfinService';
import { testRadarrConnection } from '../services/radarrService';
import { testSonarrConnection } from '../services/sonarrService';
import { JellyfinItem } from '../types';
import Spinner from './common/Spinner';
import { useTranslation } from '../hooks/useTranslation';

type ServiceStatus = 'online' | 'offline' | 'unconfigured';
interface Statuses {
    jellyfin: ServiceStatus;
    radarr: ServiceStatus;
    sonarr: ServiceStatus;
}

const StatusIndicator: React.FC<{ status: ServiceStatus }> = ({ status }) => {
    const { t } = useTranslation();
    const colorMap: Record<ServiceStatus, string> = {
        online: 'bg-green-500',
        offline: 'bg-red-500',
        unconfigured: 'bg-gray-500',
    };
    const textMap: Record<ServiceStatus, string> = {
        online: t('statusOnline'),
        offline: t('statusOffline'),
        unconfigured: t('statusUnconfigured'),
    };

    return (
        <div className="flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${colorMap[status]}`}></span>
            <span>{textMap[status]}</span>
        </div>
    );
};

const MediaCard: React.FC<{ item: JellyfinItem, imageUrl: string }> = ({ item, imageUrl }) => (
    <div className="flex-shrink-0 w-40 bg-jellyfin-light rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-200">
        <img src={imageUrl} alt={item.Name} className="w-full h-60 object-cover" />
        <div className="p-2">
            <h3 className="font-bold text-sm truncate text-white" title={item.Name}>{item.Name}</h3>
            {item.SeriesName && <p className="text-xs text-gray-400 truncate">{item.SeriesName}</p>}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const settingsCtx = useContext(SettingsContext);
    const { t } = useTranslation();
    const [statuses, setStatuses] = useState<Statuses>({ jellyfin: 'unconfigured', radarr: 'unconfigured', sonarr: 'unconfigured' });
    const [latestMovies, setLatestMovies] = useState<JellyfinItem[]>([]);
    const [latestEpisodes, setLatestEpisodes] = useState<JellyfinItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!settingsCtx?.settings?.jellyfin?.url) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const { jellyfin, radarr, sonarr } = settingsCtx.settings;

            const promises = [];

            // Jellyfin
            promises.push(
                getItems(jellyfin, ['Movie'], 10).then(movies => {
                    setLatestMovies(movies);
                    setStatuses(s => ({ ...s, jellyfin: 'online' }));
                }).catch(() => setStatuses(s => ({ ...s, jellyfin: 'offline' })))
            );
            promises.push(
                getItems(jellyfin, ['Episode'], 10).then(episodes => setLatestEpisodes(episodes))
            );

            // Radarr
            if (radarr?.url && radarr?.apiKey) {
                promises.push(
                    testRadarrConnection(radarr)
                        .then(() => setStatuses(s => ({ ...s, radarr: 'online' })))
                        .catch(() => setStatuses(s => ({ ...s, radarr: 'offline' })))
                );
            }

            // Sonarr
            if (sonarr?.url && sonarr?.apiKey) {
                promises.push(
                    testSonarrConnection(sonarr)
                        .then(() => setStatuses(s => ({ ...s, sonarr: 'online' })))
                        .catch(() => setStatuses(s => ({ ...s, sonarr: 'offline' })))
                );
            }
            
            await Promise.all(promises);
            setIsLoading(false);
        };

        fetchDashboardData();
    }, [settingsCtx]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner />
                <span className="ml-4 text-xl">{t('dashboardLoading')}</span>
            </div>
        );
    }
    
    if (statuses.jellyfin === 'unconfigured') {
         return (
             <div className="bg-jellyfin-dark-light p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-jellyfin-accent mb-4">{t('dashboardWelcomeTitle')}</h2>
                <p className="text-gray-300">
                    {t('dashboardWelcomeMessage')}
                </p>
            </div>
         );
    }

    return (
        <div className="container mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-white">{t('dashboardTitle')}</h1>

            {/* Server Status */}
            <div className="bg-jellyfin-dark-light p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-4">{t('dashboardServicesStatus')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-jellyfin-light p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-jellyfin-accent">{t('jellyfin')}</h3>
                        <StatusIndicator status={statuses.jellyfin} />
                    </div>
                    <div className="bg-jellyfin-light p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-yellow-400">{t('radarr')}</h3>
                        <StatusIndicator status={statuses.radarr} />
                    </div>
                    <div className="bg-jellyfin-light p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-blue-400">{t('sonarr')}</h3>
                        <StatusIndicator status={statuses.sonarr} />
                    </div>
                </div>
            </div>

            {/* Recently Added Movies */}
            {latestMovies.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">{t('dashboardLatestMovies')}</h2>
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                        {latestMovies.map(item => (
                            <MediaCard key={item.Id} item={item} imageUrl={getImageUrl(settingsCtx!.settings!.jellyfin, item)} />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Recently Added Episodes */}
            {latestEpisodes.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">{t('dashboardLatestEpisodes')}</h2>
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                        {latestEpisodes.map(item => (
                            <MediaCard key={item.Id} item={item} imageUrl={getImageUrl(settingsCtx!.settings!.jellyfin, item)} />
                        ))}
                    </div>
                </div>
            )}
            
            {statuses.jellyfin === 'offline' && <p className="text-red-400">{t('dashboardJellyfinError')}</p>}

        </div>
    );
};

export default Dashboard;