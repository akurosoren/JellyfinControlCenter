import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../App';
import { getJellyfinUsers } from '../services/jellyfinService';
import { testRadarrConnection } from '../services/radarrService';
import { testSonarrConnection } from '../services/sonarrService';
import { JellyfinUser, JccSettings } from '../types';
import Spinner from './common/Spinner';
import { useTranslation } from '../hooks/useTranslation';

const Settings: React.FC = () => {
    const settingsCtx = useContext(SettingsContext);
    const { t } = useTranslation();

    // Jellyfin state
    const [jfUrl, setJfUrl] = useState(settingsCtx?.settings?.jellyfin?.url || '');
    const [jfApiKey, setJfApiKey] = useState(settingsCtx?.settings?.jellyfin?.apiKey || '');
    const [jfUserId, setJfUserId] = useState(settingsCtx?.settings?.jellyfin?.userId || '');
    const [jfUsers, setJfUsers] = useState<JellyfinUser[]>([]);
    const [isLoadingJfUsers, setIsLoadingJfUsers] = useState(false);

    // Radarr state
    const [radarrUrl, setRadarrUrl] = useState(settingsCtx?.settings?.radarr?.url || '');
    const [radarrApiKey, setRadarrApiKey] = useState(settingsCtx?.settings?.radarr?.apiKey || '');
    const [isTestingRadarr, setIsTestingRadarr] = useState(false);
    const [radarrStatus, setRadarrStatus] = useState<'untested' | 'success' | 'error'>('untested');

    // Sonarr state
    const [sonarrUrl, setSonarrUrl] = useState(settingsCtx?.settings?.sonarr?.url || '');
    const [sonarrApiKey, setSonarrApiKey] = useState(settingsCtx?.settings?.sonarr?.apiKey || '');
    const [isTestingSonarr, setIsTestingSonarr] = useState(false);
    const [sonarrStatus, setSonarrStatus] = useState<'untested' | 'success' | 'error'>('untested');
    
    // Automation state
    const [movieRetentionDays, setMovieRetentionDays] = useState(settingsCtx?.settings?.automation?.movieRetentionDays || 7);
    const [tvSeasonRetentionDays, setTvSeasonRetentionDays] = useState(settingsCtx?.settings?.automation?.tvSeasonRetentionDays || 28);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (settingsCtx?.settings) {
            setJfUrl(settingsCtx.settings.jellyfin?.url || '');
            setJfApiKey(settingsCtx.settings.jellyfin?.apiKey || '');
            setJfUserId(settingsCtx.settings.jellyfin?.userId || '');
            setRadarrUrl(settingsCtx.settings.radarr?.url || '');
            setRadarrApiKey(settingsCtx.settings.radarr?.apiKey || '');
            setSonarrUrl(settingsCtx.settings.sonarr?.url || '');
            setSonarrApiKey(settingsCtx.settings.sonarr?.apiKey || '');
            setMovieRetentionDays(settingsCtx.settings.automation?.movieRetentionDays || 7);
            setTvSeasonRetentionDays(settingsCtx.settings.automation?.tvSeasonRetentionDays || 28);
        }
    }, [settingsCtx]);

    const handleFetchJfUsers = async () => {
        if (!jfUrl || !jfApiKey) {
            setError(t('settingsMissingJfUrlOrKey'));
            return;
        }
        setIsLoadingJfUsers(true);
        setError(null);
        setJfUsers([]);
        try {
            const fetchedUsers = await getJellyfinUsers({ url: jfUrl, apiKey: jfApiKey });
            setJfUsers(fetchedUsers);
            if(fetchedUsers.length > 0 && !jfUserId) {
                setJfUserId(fetchedUsers[0].Id);
            }
        } catch (err) {
            setError(t('settingsFetchUsersError'));
        } finally {
            setIsLoadingJfUsers(false);
        }
    };

    const handleTestRadarr = async () => {
        if (!radarrUrl || !radarrApiKey) return;
        setIsTestingRadarr(true);
        try {
            await testRadarrConnection({ url: radarrUrl, apiKey: radarrApiKey });
            setRadarrStatus('success');
        } catch {
            setRadarrStatus('error');
        } finally {
            setIsTestingRadarr(false);
        }
    };
    
    const handleTestSonarr = async () => {
        if (!sonarrUrl || !sonarrApiKey) return;
        setIsTestingSonarr(true);
        try {
            await testSonarrConnection({ url: sonarrUrl, apiKey: sonarrApiKey });
            setSonarrStatus('success');
        } catch {
            setSonarrStatus('error');
        } finally {
            setIsTestingSonarr(false);
        }
    };

    const handleSave = () => {
        if (settingsCtx) {
            const newSettings: JccSettings = {
                jellyfin: { url: jfUrl, apiKey: jfApiKey, userId: jfUserId },
                automation: {
                    movieRetentionDays: Number(movieRetentionDays),
                    tvSeasonRetentionDays: Number(tvSeasonRetentionDays)
                }
            };

            if (radarrUrl && radarrApiKey) {
                newSettings.radarr = { url: radarrUrl, apiKey: radarrApiKey };
            }
            
            if (sonarrUrl && sonarrApiKey) {
                newSettings.sonarr = { url: sonarrUrl, apiKey: sonarrApiKey };
            }
            
            settingsCtx.setSettings(newSettings);
            setSuccessMessage(t('settingsSaveSuccess'));
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const isSaveDisabled = !jfUrl || !jfApiKey || !jfUserId;

    return (
        <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8 title-glow">{t('settingsTitle')}</h1>
            <div className="max-w-3xl mx-auto bg-jellyfin-dark-light/70 backdrop-blur-sm border border-jellyfin-light/20 p-8 rounded-lg shadow-lg space-y-12">
                
                {/* Jellyfin Settings */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-jellyfin-accent border-b-2 border-jellyfin-accent/30 pb-2">{t('settingsJellyfinRequired')}</h2>
                    <div>
                        <label htmlFor="jfUrl" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsServerUrl')}</label>
                        <input
                            type="text" id="jfUrl" value={jfUrl} onChange={(e) => setJfUrl(e.target.value)}
                            placeholder="http://192.168.1.10:8096"
                            className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="jfApiKey" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsApiKey')}</label>
                        <input
                            type="password" id="jfApiKey" value={jfApiKey} onChange={(e) => setJfApiKey(e.target.value)}
                            placeholder={t('settingsApiKey')}
                            className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200"
                        />
                    </div>
                    <button onClick={handleFetchJfUsers} disabled={isLoadingJfUsers} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors">
                        {isLoadingJfUsers && <Spinner />}
                        {isLoadingJfUsers ? t('loading') : t('settingsLoadUsers')}
                    </button>
                    {jfUsers.length > 0 && (
                        <div>
                            <label htmlFor="jfUserId" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsUserToUse')}</label>
                            <select id="jfUserId" value={jfUserId} onChange={(e) => setJfUserId(e.target.value)} className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200">
                                <option value="">{t('settingsSelectUser')}</option>
                                {jfUsers.map(user => (<option key={user.Id} value={user.Id}>{user.Name}</option>))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Radarr Settings */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-yellow-400 border-b-2 border-yellow-400/30 pb-2">{t('settingsRadarrOptional')}</h2>
                    <div>
                        <label htmlFor="radarrUrl" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsServerUrl')}</label>
                        <input type="text" id="radarrUrl" value={radarrUrl} onChange={(e) => { setRadarrUrl(e.target.value); setRadarrStatus('untested'); }} placeholder="http://192.168.1.11:7878" className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400/70 focus:shadow-[0_0_10px_rgba(250,204,21,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                    <div>
                        <label htmlFor="radarrApiKey" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsApiKey')}</label>
                        <input type="password" id="radarrApiKey" value={radarrApiKey} onChange={(e) => { setRadarrApiKey(e.target.value); setRadarrStatus('untested'); }} placeholder={t('settingsApiKey')} className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400/70 focus:shadow-[0_0_10px_rgba(250,204,21,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                     <button onClick={handleTestRadarr} disabled={isTestingRadarr || !radarrUrl || !radarrApiKey} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        {isTestingRadarr && <Spinner />}
                        {radarrStatus === 'success' && t('settingsTestSuccess')}
                        {radarrStatus === 'error' && t('settingsTestFailure')}
                        {radarrStatus === 'untested' && !isTestingRadarr && t('settingsTestConnection')}
                    </button>
                </div>

                {/* Sonarr Settings */}
                <div className="space-y-6">
                     <h2 className="text-2xl font-semibold text-blue-400 border-b-2 border-blue-400/30 pb-2">{t('settingsSonarrOptional')}</h2>
                     <div>
                        <label htmlFor="sonarrUrl" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsServerUrl')}</label>
                        <input type="text" id="sonarrUrl" value={sonarrUrl} onChange={(e) => { setSonarrUrl(e.target.value); setSonarrStatus('untested'); }} placeholder="http://192.168.1.12:8989" className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-400/70 focus:shadow-[0_0_10px_rgba(96,165,250,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                    <div>
                        <label htmlFor="sonarrApiKey" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsApiKey')}</label>
                        <input type="password" id="sonarrApiKey" value={sonarrApiKey} onChange={(e) => { setSonarrApiKey(e.target.value); setSonarrStatus('untested'); }} placeholder={t('settingsApiKey')} className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-400/70 focus:shadow-[0_0_10px_rgba(96,165,250,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                     <button onClick={handleTestSonarr} disabled={isTestingSonarr || !sonarrUrl || !sonarrApiKey} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        {isTestingSonarr && <Spinner />}
                        {sonarrStatus === 'success' && t('settingsTestSuccess')}
                        {sonarrStatus === 'error' && t('settingsTestFailure')}
                        {sonarrStatus === 'untested' && !isTestingSonarr && t('settingsTestConnection')}
                    </button>
                </div>

                {/* Automation Settings */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-green-400 border-b-2 border-green-400/30 pb-2">{t('settingsAutomation')}</h2>
                    <div>
                        <label htmlFor="movieRetention" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsMovieRetention')}</label>
                        <input type="number" id="movieRetention" value={movieRetentionDays} onChange={(e) => setMovieRetentionDays(Number(e.target.value))} className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-400/70 focus:shadow-[0_0_10px_rgba(74,222,128,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                    <div>
                        <label htmlFor="tvRetention" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsTvSeasonRetention')}</label>
                        <input type="number" id="tvRetention" value={tvSeasonRetentionDays} onChange={(e) => setTvSeasonRetentionDays(Number(e.target.value))} className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-400/70 focus:shadow-[0_0_10px_rgba(74,222,128,0.4)] focus:outline-none transition-all duration-200" />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                
                <div>
                    <button
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className="w-full px-6 py-3 bg-gradient-to-r from-jellyfin-accent to-jellyfin-accent-light text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(170,0,255,0.6)] disabled:bg-gray-500 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
                    >
                        {t('settingsSaveButton')}
                    </button>
                    {successMessage && <p className="text-green-400 text-sm text-center mt-2">{successMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default Settings;