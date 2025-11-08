import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const Login: React.FC = () => {
    const { isPasswordSet, login, createPassword } = useAuth();
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!login(password)) {
            setError(t('loginIncorrectPassword'));
        }
    };
    
    const handleCreatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError(t('loginPasswordsMismatch'));
            return;
        }
        if (password.length < 4) {
            setError(t('loginPasswordTooShort'));
            return;
        }
        createPassword(password);
    };

    const renderLoginForm = () => (
        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-300 mb-2">{t('loginPassword')}</label>
                <input
                    type="password"
                    id="password-login"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200"
                    required
                />
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-jellyfin-accent to-jellyfin-accent-light text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(170,0,255,0.6)]">
                {t('loginButton')}
            </button>
        </form>
    );

    const renderCreatePasswordForm = () => (
        <form onSubmit={handleCreatePassword} className="space-y-6">
             <div>
                <label htmlFor="password-create" className="block text-sm font-medium text-gray-300 mb-2">{t('loginCreatePassword')}</label>
                <input
                    type="password"
                    id="password-create"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200"
                    required
                />
            </div>
            <div>
                <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-300 mb-2">{t('loginConfirmPassword')}</label>
                <input
                    type="password"
                    id="password-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-jellyfin-light/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-jellyfin-accent/70 focus:shadow-[0_0_10px_rgba(170,0,255,0.4)] focus:outline-none transition-all duration-200"
                    required
                />
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-jellyfin-accent to-jellyfin-accent-light text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(170,0,255,0.6)]">
                {t('loginSetPasswordAndEnter')}
            </button>
        </form>
    );


    return (
        <div className="flex items-center justify-center h-screen bg-transparent text-gray-200">
            <div className="w-full max-w-md mx-auto bg-jellyfin-dark-light/70 backdrop-blur-sm border border-jellyfin-light/20 p-8 rounded-lg shadow-lg">
                <div className="flex items-center justify-center mb-6">
                    <svg className="h-12 w-12 text-jellyfin-accent" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 960C264.7 960 64 759.3 64 512S264.7 64 512 64s448 200.7 448 448-200.7 448-448 448z" /><path d="M512 320c-106.1 0-192 85.9-192 192s85.9 192 192 192 192-85.9 192-192-85.9-192-192-192zm0 320c-70.7 0-128-57.3-128-128s57.3-128 128-128 128 57.3 128 128-57.3 128-128 128z" /></svg>
                    <h1 className="text-3xl font-bold ml-4 text-white title-glow">Jellyfin CC</h1>
                </div>
                 <p className="text-center text-gray-400 mb-6">
                    {isPasswordSet ? t('loginPrompt') : t('loginWelcome')}
                </p>
                {isPasswordSet ? renderLoginForm() : renderCreatePasswordForm()}
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
                <p className="text-xs text-gray-500 text-center mt-6">
                    {t('loginLocalStorageNote')}
                </p>
            </div>
        </div>
    );
};

export default Login;