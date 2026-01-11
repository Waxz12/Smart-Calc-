import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, Theme, CalcMode, AIResponse } from './types';
import Calculator from './components/Calculator';
import HistorySidebar from './components/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import { processAIMath } from './services/geminiService';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || Theme.SYSTEM;
  });
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [historyLimit, setHistoryLimit] = useState<number>(() => {
    const saved = localStorage.getItem('historyLimit');
    return saved ? parseInt(saved, 10) : 50;
  });
  
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [mode, setMode] = useState<CalcMode>('standard');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [lastAIDetail, setLastAIDetail] = useState<AIResponse | undefined>();

  // Refined theme application and listener logic
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = theme === Theme.SYSTEM 
        ? mediaQuery.matches 
        : theme === Theme.DARK;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);
    
    // Always listen for system changes but only act if theme is SYSTEM
    const listener = () => {
      if (theme === Theme.SYSTEM) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('historyLimit', historyLimit.toString());
    if (history.length > historyLimit) {
      setHistory(prev => prev.slice(0, historyLimit));
    }
  }, [historyLimit, history.length]);

  // Cycle: Light -> Dark -> System
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === Theme.LIGHT) return Theme.DARK;
      if (prev === Theme.DARK) return Theme.SYSTEM;
      return Theme.LIGHT;
    });
  };

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, historyLimit));
  }, [historyLimit]);

  const handleAIQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsProcessingAI(true);
    setLastAIDetail(undefined);
    try {
      const response = await processAIMath(query);
      setIsProcessingAI(false);
      
      if (response.result !== 'Error') {
        setDisplay(String(response.result));
        setFormula(query);
        setLastAIDetail(response);
        addToHistory({
          expression: query,
          result: String(response.result),
          isAI: true
        });
      } else {
        setFormula("AI Error: Problem too complex or ambiguous.");
      }
    } catch (error) {
      setIsProcessingAI(false);
      setFormula("Failed to connect to Gemini AI.");
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('history');
  };

  const getThemeIcon = () => {
    if (theme === Theme.SYSTEM) {
      return (
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (theme === Theme.LIGHT) {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-white to-zinc-200 dark:from-zinc-950 dark:to-zinc-900 transition-all duration-500">
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200/50 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h1 className="text-xl font-bold font-google text-gray-900 dark:text-white tracking-tight">SmartCalc AI</h1>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2.5 text-gray-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90" title="Settings">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={() => setShowHistory(true)} className="p-2.5 text-gray-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90" title="History">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1 hidden md:block"></div>
          <button 
            onClick={toggleTheme} 
            className="p-2.5 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90 flex items-center justify-center" 
            title={`Theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        <Calculator 
          display={display} 
          setDisplay={setDisplay}
          formula={formula}
          setFormula={setFormula}
          mode={mode}
          setMode={setMode}
          onAIQuery={handleAIQuery}
          isProcessingAI={isProcessingAI}
          addToHistory={addToHistory}
          aiDetail={lastAIDetail}
        />
      </main>

      {showHistory && (
        <HistorySidebar 
          history={history} 
          onClose={() => setShowHistory(false)} 
          onClear={clearHistory}
          onSelect={(item) => {
            setDisplay(item.result);
            setFormula(item.expression);
            setShowHistory(false);
            setLastAIDetail(undefined);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal 
          limit={historyLimit}
          setLimit={setHistoryLimit}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setShowSettings(false)}
        />
      )}

      <footer className="py-4 text-center text-xs text-gray-400 dark:text-zinc-600 font-medium tracking-wide">
        Powered by Waxz Solutions
      </footer>
    </div>
  );
};

export default App;