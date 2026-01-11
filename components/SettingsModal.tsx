
import React from 'react';
import { Theme } from '../types';

interface SettingsModalProps {
  limit: number;
  setLimit: (limit: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ limit, setLimit, theme, setTheme, onClose }) => {
  const limits = [10, 25, 50, 100, 250];
  const themes = [
    { id: Theme.LIGHT, label: 'Light', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: Theme.DARK, label: 'Dark', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> },
    { id: Theme.SYSTEM, label: 'System', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-zinc-800">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold font-google text-gray-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Selection */}
          <section>
            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 mb-3 uppercase tracking-widest">
              Appearance
            </label>
            <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    theme === t.id
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* History Limit */}
          <section>
            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 mb-3 uppercase tracking-widest">
              History Limit
            </label>
            <div className="grid grid-cols-5 gap-1">
              {limits.map((l) => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={`py-2 rounded-lg font-google font-medium text-xs transition-all border ${
                    limit === l
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-zinc-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-500 dark:text-zinc-500 leading-normal">
              Number of past calculations to keep. Pruning occurs automatically when decreased.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 dark:text-zinc-500 font-medium">Gemini Smart Calc</span>
            <span className="text-gray-400 dark:text-zinc-600">v2.2.0-stable</span>
          </section>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
