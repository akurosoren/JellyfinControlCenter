import React, { useState, useContext, useCallback } from 'react';
import { SettingsContext } from '../App';
import { getItems, getItemsByIds, getImageUrl } from '../services/jellyfinService';
import { getRadarrMovies, deleteRadarrMovie } from '../services/radarrService';
import { getSonarrSeries, getSonarrEpisodes, deleteSonarrEpisodeFile } from '../services/sonarrService';
import { JellyfinItem } from '../types';
import { PlayIcon, TrashIcon, SmallShieldIcon, ShieldCheckIcon } from '../constants';
import Spinner from './common/Spinner';
import Modal from './common/Modal';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const Automation: React.FC = () => {
    const settingsCtx = useContext(SettingsContext);
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [deletableItems, setDeletableItems] = useState<JellyfinItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exclusions, setExclusions] = useLocalStorage<string[]>('jellyfin-exclusions', []);

    const movieRetentionDays = settingsCtx?.settings?.automation?.movieRetentionDays || 7;
    const tvSeasonRetentionDays = settingsCtx?.settings?.automation?.tvSeasonRetentionDays || 28;

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    const handleScan = useCallback(async () => {
        if (!settingsCtx?.settings?.jellyfin) {
            setError(t('automationJellyfinNotConfigured'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setDeletableItems([]);
        setSelectedItems(new Set());
        addLog(t('logScanStarted'));

        try {
            const allItems = await getItems(settingsCtx.settings.jellyfin, ['Movie', 'Season']);
            addLog(t('logScanFoundItems', { count: allItems.length }));
            const now = new Date();

            const itemsToFilter = allItems.filter(item => {
                if (exclusions.includes(item.Id)) {
                    return false;
                }
                const dateCreated = new Date(item.DateCreated);
                const ageInDays = (now.getTime() - dateCreated.getTime()) / (1000 * 3600 * 24);

                if (item.Type === 'Movie' && ageInDays > movieRetentionDays) {
                    return true;
                }
                if (item.Type === 'Season' && ageInDays > tvSeasonRetentionDays) {
                    return true;
                }
                return false;
            });
            
            setDeletableItems(itemsToFilter);
            setSelectedItems(new Set(itemsToFilter.map(item => item.Id))); // Select all by default
            addLog(t('logScanComplete', { count: itemsToFilter.length }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('logScanError', { error: errorMessage }));
            addLog(t('logError', { error: errorMessage }));
        } finally {
            setIsLoading(false);
        }
    }, [settingsCtx, exclusions, movieRetentionDays, tvSeasonRetentionDays, t]);

    const handleToggleSelection = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };
    
    const handleExcludeItem = (e: React.MouseEvent, itemToExclude: JellyfinItem) => {
        e.stopPropagation(); // Prevent card selection toggle
        setExclusions(prev => [...new Set([...prev, itemToExclude.Id])]);
        setDeletableItems(prev => prev.filter(item => item.Id !== itemToExclude.Id));
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemToExclude.Id);
            return newSet;
        });
        addLog(t('logItemExcluded', { name: itemToExclude.Name }));
    };

    const handleExcludeAll = () => {
        if (deletableItems.length === 0) return;

        const idsToExclude = deletableItems.map(item => item.Id);
        setExclusions(prev => [...new Set([...prev, ...idsToExclude])]);
        
        addLog(t('logAllExcluded', { count: idsToExclude.length }));

        // Clear the current view
        setDeletableItems([]);
        setSelectedItems(new Set());
    };

    const handleDelete = async () => {
        if (!settingsCtx?.settings || selectedItems.size === 0) return;
        const { jellyfin, radarr, sonarr } = settingsCtx.settings;

        setIsModalOpen(false);
        setIsLoading(true);
        addLog(t('logDeletionStarted', { count: selectedItems.size }));

        const itemsToDelete = deletableItems.filter(item => selectedItems.has(item.Id));
        let successCount = 0;
        
        try {
            const radarrMovies = radarr?.url && radarr?.apiKey ? await getRadarrMovies(radarr) : [];
            const sonarrSeries = sonarr?.url && sonarr?.apiKey ? await getSonarrSeries(sonarr) : [];
            
            const seasonItems = itemsToDelete.filter(i => i.Type === 'Season');
            const seriesIds = [...new Set(seasonItems.map(s => s.SeriesId).filter(Boolean) as string[])];
            const jellyfinParentSeries = seriesIds.length > 0 ? await getItemsByIds(jellyfin, seriesIds) : [];
            const seriesIdToProviderIdMap = new Map(jellyfinParentSeries.map(s => [s.Id, s.ProviderIds?.Tvdb]));
            
            for (const item of itemsToDelete) {
                if (item.Type === 'Movie') {
                    if (!radarr?.url || !radarr?.apiKey) {
                        addLog(t('logDeletionFailedRadarr', { name: item.Name }));
                        continue;
                    }
                    if (!item.ProviderIds?.Tmdb) {
                        addLog(t('logDeletionFailedTmdb', { name: item.Name }));
                        continue;
                    }

                    const radarrMovie = radarrMovies.find(m => m.tmdbId === parseInt(item.ProviderIds!.Tmdb!));
                    if (radarrMovie) {
                        await deleteRadarrMovie(radarr, radarrMovie.id);
                        addLog(t('logDeletionSuccessRadarr', { name: item.Name }));
                        successCount++;
                    } else {
                        addLog(t('logDeletionInfoRadarr', { name: item.Name }));
                    }
                } else if (item.Type === 'Season') {
                    if (!sonarr?.url || !sonarr?.apiKey) {
                        addLog(t('logDeletionFailedSonarr', { seriesName: item.SeriesName, name: item.Name }));
                        continue;
                    }
                    const tvdbId = seriesIdToProviderIdMap.get(item.SeriesId!);
                    if (!tvdbId) {
                        addLog(t('logDeletionFailedTvdb', { seriesName: item.SeriesName, name: item.Name }));
                        continue;
                    }

                    const sonarrSerie = sonarrSeries.find(s => s.tvdbId === parseInt(tvdbId));
                    if (sonarrSerie) {
                        const episodes = await getSonarrEpisodes(sonarr, sonarrSerie.id);
                        const seasonNumberMatch = item.Name.match(/\d+/);
                        if (!seasonNumberMatch) {
                            addLog(t('logDeletionFailedSeasonNumber', { name: item.Name }));
                            continue;
                        }
                        const seasonNumber = parseInt(seasonNumberMatch[0]);

                        const episodesToDelete = episodes.filter(e => e.seasonNumber === seasonNumber && e.hasFile);
                        if (episodesToDelete.length === 0) {
                            addLog(t('logDeletionInfoSonarrFiles', { seriesName: item.SeriesName, name: item.Name }));
                            successCount++;
                            continue;
                        }
                        
                        let episodeDeletionSuccess = true;
                        for (const episode of episodesToDelete) {
                            try {
                               await deleteSonarrEpisodeFile(sonarr, episode.episodeFileId);
                            } catch (err) {
                               const episodeErrorMessage = err instanceof Error ? err.message : String(err);
                               addLog(t('logDeletionFailedEpisode', { seriesName: item.SeriesName, name: item.Name, error: episodeErrorMessage }));
                               episodeDeletionSuccess = false;
                            }
                        }
                        if(episodeDeletionSuccess) {
                            addLog(t('logDeletionSuccessSonarr', { count: episodesToDelete.length, seriesName: item.SeriesName, name: item.Name }));
                            successCount++;
                        } else {
                             addLog(t('logDeletionFailedSonarrMulti', { seriesName: item.SeriesName, name: item.Name }));
                        }
                    } else {
                        addLog(t('logDeletionInfoSonarrSeries', { seriesName: item.SeriesName }));
                    }
                }
            }
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('logDeletionCriticalError', { error: errorMessage }));
            addLog(t('logError', { error: errorMessage }));
        }
        
        addLog(t('logDeletionComplete', { successCount, total: itemsToDelete.length }));
        setIsLoading(false);
        handleScan();
    };
    
    const getLocalizedItemType = (item: JellyfinItem) => {
        switch(item.Type) {
            case 'Movie': return t('typeMovie');
            case 'Series': return t('typeSeries');
            case 'Season': return t('typeSeason');
            default: return item.Type;
        }
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">{t('automationTitle')}</h1>
            <p className="text-gray-400 mb-8">{t('automationDescription')}</p>

            <div className="bg-jellyfin-dark-light p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('automationRetentionRules')}</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li><span className="font-bold">{t('typeMovie')}s:</span> {t('automationMovieRule', { days: movieRetentionDays })}</li>
                    <li><span className="font-bold">{t('typeSeason')}s:</span> {t('automationSeasonRule', { days: tvSeasonRetentionDays })}</li>
                </ul>
                <button
                    onClick={handleScan}
                    disabled={isLoading}
                    className="mt-6 flex items-center justify-center px-6 py-3 bg-jellyfin-accent hover:bg-jellyfin-accent-light rounded-lg font-semibold text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Spinner /> : <PlayIcon />}
                    {isLoading ? t('automationScanning') : t('automationScanButton')}
                </button>
            </div>

            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-white mb-4">{t('automationItemsToDelete', { selected: selectedItems.size, total: deletableItems.length })}</h2>
                    {deletableItems.length > 0 && (
                        <div className="flex flex-wrap gap-4 mb-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={isLoading || selectedItems.size === 0}
                                className="flex items-center justify-center px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <TrashIcon />
                                {t('automationDeleteButton', { count: selectedItems.size })}
                            </button>
                             <button
                                onClick={handleExcludeAll}
                                disabled={isLoading || deletableItems.length === 0}
                                className="flex items-center justify-center px-5 py-2 bg-jellyfin-accent hover:bg-jellyfin-accent-light rounded-lg font-semibold text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <ShieldCheckIcon />
                                {t('automationExcludeAllButton', { count: deletableItems.length })}
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                        {deletableItems.map(item => (
                            <div key={item.Id} className="bg-jellyfin-light rounded-lg overflow-hidden shadow-lg relative cursor-pointer group" onClick={() => handleToggleSelection(item.Id)}>
                                <img src={settingsCtx?.settings?.jellyfin ? getImageUrl(settingsCtx.settings.jellyfin, item) : ''} alt={item.Name} className="w-full h-48 object-cover" />
                                <div className="p-3">
                                    <h3 className="font-bold truncate" title={item.Name}>{item.Name}</h3>
                                    <p className="text-sm text-gray-400">{item.Type === 'Season' ? item.SeriesName : getLocalizedItemType(item)}</p>
                                    <p className="text-xs text-gray-500">{t('automationAddedOn', { date: new Date(item.DateCreated).toLocaleDateString(language) })}</p>
                                </div>
                                <div className={`absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedItems.has(item.Id) ? 'bg-jellyfin-accent border-jellyfin-accent-light' : 'bg-black/50 border-gray-400'}`}>
                                    {selectedItems.has(item.Id) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <button 
                                    onClick={(e) => handleExcludeItem(e, item)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-jellyfin-accent transition-colors opacity-0 group-hover:opacity-100"
                                    title={t('automationExcludeTooltip')}
                                >
                                    <SmallShieldIcon />
                                </button>
                            </div>
                        ))}
                         {deletableItems.length === 0 && !isLoading && (
                            <div className="col-span-full text-center py-10 text-gray-500">
                                {t('automationNoItemsFound')}
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-bold text-white mb-4">{t('automationLogs')}</h2>
                    <div className="bg-jellyfin-dark-light p-4 rounded-lg h-96 overflow-y-auto text-sm font-mono">
                        {logs.map((log, index) => (
                            <p key={index} className={`whitespace-pre-wrap ${log.startsWith('[') ? 'text-gray-400' : ''} ${log.includes(t('success').toUpperCase()) ? 'text-green-400' : ''} ${log.includes(t('error', {count: ''}).toUpperCase()) || log.includes('ÉCHEC') ? 'text-red-400' : ''} ${log.includes('INFO') ? 'text-blue-400' : ''}`}>
                                {log}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                title={t('automationModalTitle')}
            >
                {t('automationModalBody', { count: selectedItems.size })}
            </Modal>
        </div>
    );
};

export default Automation;