import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Language, t } from '../lib/i18n';
import { LogIn, Mail, Lock, Phone, Mail as MailIcon } from 'lucide-react';

interface LoginScreenProps {
  lang: Language;
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ lang, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || t('loginError', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0a0b0d] dark:to-[#0f1115] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800">
        {/* Logo - YAMANIX الأساسي */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-[#cbb26a] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl font-black text-black">Y</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">YAMANIX</h1>
          <p className="text-sm font-semibold text-[#cbb26a] mt-1">VEHICLE MANAGEMENT SYSTEM</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('loginSubtitle', lang)}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('loginEmail', lang)}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#cbb26a] focus:outline-none transition"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('loginPassword', lang)}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#cbb26a] focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-800/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#cbb26a] hover:bg-[#b89f57] text-black font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>{t('loginLoading', lang)}</>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {t('loginButton', lang)}
              </>
            )}
          </button>
        </form>

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium">{t('loginSupport', lang)}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-1">
              <a href="tel:+971586692733" className="flex items-center gap-1.5 hover:text-[#cbb26a] transition">
                <Phone className="w-3.5 h-3.5" />
                <span>+971 58 669 2733</span>
              </a>
              <a href="mailto:bahaa.it2020@gmail.com" className="flex items-center gap-1.5 hover:text-[#cbb26a] transition">
                <MailIcon className="w-3.5 h-3.5" />
                <span>bahaa.it2020@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer - All Rights Reserved */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            جميع الحقوق محفوظة © 2026
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            فريق YAMANIX TEAM &amp; BAHAA NASIR
          </p>
        </div>
      </div>
    </div>
  );
};