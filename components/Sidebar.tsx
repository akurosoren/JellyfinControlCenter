import React from 'react';
import { DashboardIcon, AutomationIcon, SettingsIcon, ShieldIcon, LogoutIcon } from '../constants';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

type View = 'dashboard' | 'automation' | 'settings' | 'exclusions';

interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    const { logout } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();

    const navItems = [
        { id: 'dashboard', icon: <DashboardIcon />, label: t('sidebarDashboard') },
        { id: 'automation', icon: <AutomationIcon />, label: t('sidebarAutomation') },
        { id: 'exclusions', icon: <ShieldIcon />, label: t('sidebarExclusions') },
        { id: 'settings', icon: <SettingsIcon />, label: t('sidebarSettings') },
    ];

    return (
        <aside className="w-16 md:w-64 bg-jellyfin-dark-light/50 backdrop-blur-sm border-r border-jellyfin-light/20 p-2 md:p-4 flex flex-col transition-all duration-300">
            <div className="flex items-center justify-center md:justify-start mb-10">
                 <svg className="h-10 w-10 text-jellyfin-accent" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 960C264.7 960 64 759.3 64 512S264.7 64 512 64s448 200.7 448 448-200.7 448-448 448z" /><path d="M512 320c-106.1 0-192 85.9-192 192s85.9 192 192 192 192-85.9 192-192-85.9-192-192-192zm0 320c-70.7 0-128-57.3-128-128s57.3-128 128-128 128 57.3 128 128-57.3 128-128 128z" /></svg>
                 <span className="hidden md:block text-2xl font-bold ml-3 text-white title-glow">Jellyfin CC</span>
            </div>
            <nav>
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setView(item.id as View)}
                                className={`w-full flex items-center p-3 my-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                                    currentView === item.id
                                        ? 'bg-gradient-to-r from-jellyfin-accent to-jellyfin-accent-light text-white shadow-[0_0_15px_rgba(170,0,255,0.5)]'
                                        : 'text-gray-400 hover:bg-jellyfin-light/50 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span className="hidden md:block ml-4 font-semibold">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="mt-auto">
                 <div className="hidden md:flex justify-center space-x-2 my-4">
                    <button onClick={() => setLanguage('fr')} className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 ${language === 'fr' ? 'bg-jellyfin-accent text-white shadow-[0_0_10px_rgba(170,0,255,0.4)]' : 'bg-jellyfin-light/50 text-gray-400 hover:text-white hover:bg-jellyfin-light'}`}>FR</button>
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 ${language === 'en' ? 'bg-jellyfin-accent text-white shadow-[0_0_10px_rgba(170,0,255,0.4)]' : 'bg-jellyfin-light/50 text-gray-400 hover:text-white hover:bg-jellyfin-light'}`}>EN</button>
                </div>
                <button
                    onClick={logout}
                    className={'w-full flex items-center p-3 my-2 rounded-lg transition-colors text-gray-400 hover:bg-jellyfin-light/50 hover:text-white'}
                >
                    <LogoutIcon />
                    <span className="hidden md:block ml-4 font-semibold">{t('sidebarLogout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;