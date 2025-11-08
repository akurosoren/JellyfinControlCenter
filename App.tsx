import React, { useState, createContext, useMemo, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { JccSettings } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Automation from './components/Automation';
import Settings from './components/Settings';
import Exclusions from './components/Exclusions';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTranslation } from './hooks/useTranslation';

type View = 'dashboard' | 'automation' | 'settings' | 'exclusions';

interface SettingsContextType {
    settings: JccSettings | null;
    setSettings: React.Dispatch<React.SetStateAction<JccSettings | null>>;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

const MainApp: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<JccSettings | null>('jcc-settings', null);
    const [view, setView] = useState<View>('dashboard');
    const { language } = useLanguage();
    const { t } = useTranslation();

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const contextValue = useMemo(() => ({ settings, setSettings }), [settings, setSettings]);

    const renderView = () => {
        if (!settings?.jellyfin?.url && view !== 'settings') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-2xl font-bold mb-4 title-glow">{t('appWelcomeTitle')}</h2>
                    <p className="text-gray-400 mb-6">{t('appWelcomeMessage')}</p>
                    <button
                        onClick={() => setView('settings')}
                        className="px-6 py-2 bg-gradient-to-r from-jellyfin-accent to-jellyfin-accent-light text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(170,0,255,0.5)]"
                    >
                        {t('appWelcomeButton')}
                    </button>
                </div>
            )
        }

        switch (view) {
            case 'dashboard':
                return <Dashboard />;
            case 'automation':
                return <Automation />;
            case 'exclusions':
                return <Exclusions />;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            <div className="flex h-screen bg-transparent text-gray-200 font-sans">
                <Sidebar currentView={view} setView={setView} />
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto transition-opacity duration-500">
                    {renderView()}
                </main>
            </div>
        </SettingsContext.Provider>
    );
};

const AppWithAuth: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <MainApp /> : <Login />;
}

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <AppWithAuth />
            </AuthProvider>
        </LanguageProvider>
    );
};


export default App;