
import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onClose: () => void;
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onClose, onClear, onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div className="relative w-full max-w-xs h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold font-google text-gray-900 dark:text-white">History</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 space-y-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No history yet</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full text-left p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.isAI && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded uppercase">
                      AI Result
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-medium">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-zinc-400 truncate mb-1">
                  {item.expression}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.result}
                </div>
              </button>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-6 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={onClear}
              className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-bold text-sm"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
