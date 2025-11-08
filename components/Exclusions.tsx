import React, { useState, useContext, useEffect, useCallback } from 'react';
import { SettingsContext } from '../App';
import useLocalStorage from '../hooks/useLocalStorage';
import { getItemsByIds, getImageUrl } from '../services/jellyfinService';
import { JellyfinItem } from '../types';
import Spinner from './common/Spinner';
import { TrashIcon } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const Exclusions: React.FC = () => {
    const settingsCtx = useContext(SettingsContext);
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [excludedIds, setExcludedIds] = useLocalStorage<string[]>('jellyfin-exclusions', []);
    const [excludedItems, setExcludedItems] = useState<JellyfinItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExcludedItems = useCallback(async () => {
        if (!settingsCtx?.settings?.jellyfin || excludedIds.length === 0) {
            setExcludedItems([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const items = await getItemsByIds(settingsCtx.settings.jellyfin, excludedIds);
            setExcludedItems(items);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('exclusionsFetchError', { error: errorMessage }));
        } finally {
            setIsLoading(false);
        }
    }, [settingsCtx?.settings?.jellyfin, excludedIds, t]);

    useEffect(() => {
        fetchExcludedItems();
    }, [fetchExcludedItems]);

    const handleRemoveExclusion = (itemId: string) => {
        setExcludedIds(prev => prev.filter(id => id !== itemId));
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
            <h1 className="text-4xl font-bold text-white mb-4 title-glow">{t('exclusionsTitle')}</h1>
            <p className="text-gray-400 mb-8">
                {t('exclusionsDescription')}
            </p>
            
            {isLoading && (
                <div className="flex justify-center items-center mt-8">
                    <Spinner />
                    <span className="ml-2 text-lg">{t('exclusionsLoading')}</span>
                </div>
            )}
            
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
            
            {!isLoading && excludedItems.length === 0 && (
                <div className="text-center py-10 text-gray-500 bg-jellyfin-dark-light/70 backdrop-blur-sm border border-jellyfin-light/20 rounded-lg">
                    <h3 className="text-xl">{t('exclusionsNoItems')}</h3>
                    <p className="mt-2">{t('exclusionsNoItemsHint')}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {excludedItems.map(item => (
                    <div key={item.Id} className="bg-jellyfin-dark-light/70 backdrop-blur-sm border border-jellyfin-light/20 rounded-lg overflow-hidden shadow-lg relative group">
                        <img src={settingsCtx?.settings?.jellyfin ? getImageUrl(settingsCtx.settings.jellyfin, item) : ''} alt={item.Name} className="w-full h-48 object-cover" />
                        <div className="p-3">
                            <h3 className="font-bold truncate" title={item.Name}>{item.Name}</h3>
                            <p className="text-sm text-gray-400">{item.Type === 'Season' ? item.SeriesName : getLocalizedItemType(item)}</p>
                            <p className="text-xs text-gray-500">{t('automationAddedOn', { date: new Date(item.DateCreated).toLocaleDateString(language) })}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                                onClick={() => handleRemoveExclusion(item.Id)}
                                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-all transform hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                title={t('exclusionsRemoveTooltip')}
                            >
                                <TrashIcon />
                                {t('exclusionsRemoveButton')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Exclusions;