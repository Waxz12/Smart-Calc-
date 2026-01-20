
import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, Theme, CalcMode, AIResponse } from './types';
import Calculator from './components/Calculator';
import HistorySidebar from './components/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import { processAIMath } from './services/geminiService';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || Theme.SYSTEM);
  const [historyLimit, setHistoryLimit] = useState<number>(() => Number(localStorage.getItem('historyLimit')) || 50);
  const [history, setHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem('history') || '[]'));
  
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [mode, setMode] = useState<CalcMode>('standard');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [lastAIDetail, setLastAIDetail] = useState<AIResponse | undefined>();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { 
      window.removeEventListener('online', online); 
      window.removeEventListener('offline', offline); 
    };
  }, []);

  useEffect(() => {
    const isDark = theme === Theme.SYSTEM ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === Theme.DARK;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Prune history when limit changes
    const pruned = history.slice(0, historyLimit);
    if (pruned.length !== history.length) {
      setHistory(pruned);
    }
    localStorage.setItem('history', JSON.stringify(pruned));
    localStorage.setItem('historyLimit', String(historyLimit));
  }, [history, historyLimit]);

  const handleAIQuery = async (query: string) => {
    if (isOffline) { 
      setFormula("Offline: AI disabled"); 
      return; 
    }
    setIsProcessingAI(true);
    try {
      const res = await processAIMath(query);
      if (res.result !== "Error") {
        setDisplay(String(res.result));
        setFormula(query);
        setLastAIDetail(res);
        const newItem: HistoryItem = { 
          id: crypto.randomUUID(), 
          expression: query, 
          result: String(res.result), 
          timestamp: Date.now(), 
          isAI: true 
        };
        setHistory(prev => [newItem, ...prev].slice(0, historyLimit));
      }
    } finally { 
      setIsProcessingAI(false); 
    }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, historyLimit));
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-zinc-950 transition-colors">
      {isOffline && (
        <div className="bg-amber-500 text-white text-[10px] text-center py-1 font-bold uppercase tracking-widest z-50">
          Offline - AI Unavailable
        </div>
      )}
      
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-30">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-600 text-white rounded-lg">C</span> SmartCalc
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSettings(true)} 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="Settings"
          >
            ⚙️
          </button>
          <button 
            onClick={() => setShowHistory(true)} 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="History"
          >
            🕒
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
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
          onClear={() => setHistory([])} 
          onSelect={(i) => { 
            setDisplay(i.result); 
            setFormula(i.expression); 
            setShowHistory(false); 
          }} 
        />
      )}
      
      {showSettings && (
        <SettingsModal 
          theme={theme} 
          setTheme={setTheme} 
          limit={historyLimit}
          setLimit={setHistoryLimit}
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;
