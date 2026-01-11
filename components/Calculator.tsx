import React, { useState, useRef } from 'react';
import { CalcMode, HistoryItem, AIResponse } from '../types';
import * as math from 'mathjs';

interface CalculatorProps {
  display: string;
  setDisplay: (val: string) => void;
  formula: string;
  setFormula: (val: string) => void;
  mode: CalcMode;
  setMode: (mode: CalcMode) => void;
  onAIQuery: (query: string) => Promise<void>;
  isProcessingAI: boolean;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  aiDetail?: AIResponse;
}

const Calculator: React.FC<CalculatorProps> = ({ 
  display, setDisplay, formula, setFormula, 
  mode, setMode, onAIQuery, isProcessingAI, addToHistory, aiDetail 
}) => {
  const [aiInput, setAiInput] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [formulaResults, setFormulaResults] = useState<{line: string, result: string}[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isDegree, setIsDegree] = useState(true);
  const [showInv, setShowInv] = useState(false);
  
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  const formulaRef = useRef<HTMLTextAreaElement>(null);

  const handleNumber = (num: string) => {
    if (lastResult || display === 'Error') {
      setDisplay(num);
      setLastResult(null);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setLastResult(null);
    if (display === 'Error') return;
    const currentBase = lastResult ? display : (formula.includes('=') ? display : formula + display);
    setFormula(currentBase + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      // Replace visual symbols with mathjs compatible operators
      const fullExpression = (formula + display)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/e/g, 'e');
        
      const result = math.evaluate(fullExpression);
      const formattedResult = math.format(result, { precision: 10 });
      
      addToHistory({
        expression: formula + display,
        result: String(formattedResult)
      });
      
      setDisplay(String(formattedResult));
      setFormula(formula + display + ' =');
      setLastResult(String(formattedResult));
    } catch (e) {
      setDisplay('Error');
    }
  };

  const solveFormulaLab = () => {
    if (!formulaInput.trim()) return;
    const lines = formulaInput.split('\n');
    const scope = {};
    const results: {line: string, result: string}[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        results.push({ line: '', result: '' });
        return;
      }
      try {
        const res = math.evaluate(trimmed, scope);
        const formatted = res !== undefined ? String(res) : '';
        results.push({ line: trimmed, result: formatted });
      } catch (e) {
        results.push({ line: trimmed, result: 'Error' });
      }
    });

    setFormulaResults(results);
    const lastValidResult = [...results].reverse().find(r => r.result && r.result !== 'Error');
    if (lastValidResult) {
      setDisplay(lastValidResult.result);
      addToHistory({
        expression: "Formula Lab Session",
        result: lastValidResult.result
      });
    }
  };

  const handleScientific = (func: string) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return;
      
      let res: any;
      switch(func) {
        case 'sin': res = math.sin(isDegree ? math.unit(val, 'deg') : val); break;
        case 'cos': res = math.cos(isDegree ? math.unit(val, 'deg') : val); break;
        case 'tan': res = math.tan(isDegree ? math.unit(val, 'deg') : val); break;
        case 'asin': res = math.asin(val); break;
        case 'acos': res = math.acos(val); break;
        case 'atan': res = math.atan(val); break;
        case 'sinh': res = math.sinh(val); break;
        case 'cosh': res = math.cosh(val); break;
        case 'tanh': res = math.tanh(val); break;
        case 'asinh': res = math.asinh(val); break;
        case 'acosh': res = math.acosh(val); break;
        case 'atanh': res = math.atanh(val); break;
        case '√': res = math.sqrt(val); break;
        case 'log': res = math.log10(val); break;
        case 'ln': res = math.log(val); break;
        case 'x²': res = math.square(val); break;
        case 'n!': res = math.factorial(val); break;
        case 'abs': res = math.abs(val); break;
        case '1/x': res = math.divide(1, val); break;
        default: return;
      }

      if (isDegree && ['asin', 'acos', 'atan'].includes(func)) {
        res = math.unit(res, 'rad').toNumber('deg');
      }

      const formattedRes = math.format(res, { precision: 10 });
      addToHistory({ expression: `${func}(${display})`, result: String(formattedRes) });
      setDisplay(String(formattedRes));
      setFormula(`${func}(${display}) =`);
      setLastResult(String(formattedRes));
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setFormula('');
    setLastResult(null);
    if (mode === 'formula') {
      setFormulaInput('');
      setFormulaResults([]);
    }
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const renderContent = () => {
    if (mode === 'ai') {
      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative">
            <textarea
              ref={aiInputRef}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask Gemini anything: 'Tip on 45.50 at 18%' or 'Calories burned running 5km at 10km/h'"
              className="w-full h-28 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
            />
            {isProcessingAI && (
              <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-indigo-600">Thinking...</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onAIQuery(aiInput)}
            disabled={isProcessingAI || !aiInput.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Solve with Gemini AI
          </button>

          {aiDetail && !isProcessingAI && aiDetail.result !== 'Error' && (
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-4 animate-in zoom-in-95">
              <h3 className="font-bold text-sm text-indigo-600 uppercase tracking-wider">Solution Breakdown</h3>
              {aiDetail.formulaUsed && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core Formula</span>
                  <p className="text-sm font-mono text-gray-800 dark:text-zinc-200">{aiDetail.formulaUsed}</p>
                </div>
              )}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logic Steps</span>
                <ul className="space-y-2">
                  {aiDetail.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-600 dark:text-zinc-400">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold">{idx + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (mode === 'formula') {
      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex min-h-[250px]">
                  <div className="w-10 bg-gray-200/50 dark:bg-zinc-900/50 text-right pr-2 pt-4 text-[10px] font-mono text-gray-400 select-none">
                      {Array.from({length: Math.max(12, formulaInput.split('\n').length)}).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                      ))}
                  </div>
                  <textarea
                      ref={formulaRef}
                      value={formulaInput}
                      onChange={(e) => setFormulaInput(e.target.value)}
                      placeholder={"a = 15\nb = 22\nsqrt(a^2 + b^2)"}
                      className="flex-1 p-4 bg-transparent text-gray-800 dark:text-zinc-200 font-mono text-sm focus:outline-none resize-none"
                      spellCheck={false}
                  />
              </div>
          </div>
          <button onClick={solveFormulaLab} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
            Execute Lab Session
          </button>
          {formulaResults.length > 0 && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700">
                {formulaResults.map((r, i) => r.line && (
                    <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-gray-100 dark:border-zinc-700 pb-1 last:border-0">
                        <span className="text-gray-500 truncate mr-4">{r.line}</span>
                        <span className={`font-bold ${r.result === 'Error' ? 'text-red-500' : 'text-emerald-500'}`}>{r.result}</span>
                    </div>
                ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`grid gap-2.5 ${mode === 'scientific' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {mode === 'scientific' && (
          <>
            <CalcButton 
              onClick={() => setShowInv(!showInv)} 
              label="INV" 
              type="sci" 
              className={showInv ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"} 
            />
            <CalcButton onClick={() => handleScientific(showInv ? 'asin' : 'sin')} label={showInv ? "sin⁻¹" : "sin"} type="sci" />
            <CalcButton onClick={() => handleScientific(showInv ? 'acos' : 'cos')} label={showInv ? "cos⁻¹" : "cos"} type="sci" />
            <CalcButton onClick={() => handleScientific(showInv ? 'atan' : 'tan')} label={showInv ? "tan⁻¹" : "tan"} type="sci" />
            <CalcButton onClick={() => handleScientific(showInv ? 'asinh' : 'sinh')} label={showInv ? "sinh⁻¹" : "sinh"} type="sci" />
            
            <CalcButton onClick={() => handleScientific(showInv ? 'acosh' : 'cosh')} label={showInv ? "cosh⁻¹" : "cosh"} type="sci" />
            <CalcButton onClick={() => handleScientific(showInv ? 'atanh' : 'tanh')} label={showInv ? "tanh⁻¹" : "tanh"} type="sci" />
            <CalcButton onClick={() => handleScientific('√')} label="√" type="sci" />
            <CalcButton onClick={() => handleScientific('log')} label="log" type="sci" />
            <CalcButton onClick={() => handleScientific('ln')} label="ln" type="sci" />
            
            <CalcButton onClick={() => handleScientific('x²')} label="x²" type="sci" />
            <CalcButton onClick={() => handleOperator('^')} label="xʸ" type="sci" />
            <CalcButton onClick={() => handleNumber('π')} label="π" type="sci" />
            <CalcButton onClick={() => handleNumber('e')} label="e" type="sci" />
            <CalcButton onClick={() => handleScientific('n!')} label="n!" type="sci" />

            <CalcButton onClick={() => setIsDegree(!isDegree)} label={isDegree ? 'DEG' : 'RAD'} type="sci" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600" />
            <CalcButton onClick={() => handleNumber('(')} label="(" type="sci" />
            <CalcButton onClick={() => handleNumber(')')} label=")" type="sci" />
            <CalcButton onClick={() => handleScientific('abs')} label="abs" type="sci" />
            <CalcButton onClick={() => handleOperator('%')} label="mod" type="sci" />
          </>
        )}
        <CalcButton onClick={clear} label="C" type="action" className="text-red-500" />
        <CalcButton onClick={backspace} label="⌫" type="action" />
        <CalcButton onClick={() => handleScientific('1/x')} label="1/x" type="action" />
        <CalcButton onClick={() => handleOperator('÷')} label="÷" type="operator" />

        <CalcButton onClick={() => handleNumber('7')} label="7" />
        <CalcButton onClick={() => handleNumber('8')} label="8" />
        <CalcButton onClick={() => handleNumber('9')} label="9" />
        <CalcButton onClick={() => handleOperator('×')} label="×" type="operator" />

        <CalcButton onClick={() => handleNumber('4')} label="4" />
        <CalcButton onClick={() => handleNumber('5')} label="5" />
        <CalcButton onClick={() => handleNumber('6')} label="6" />
        <CalcButton onClick={() => handleOperator('-')} label="-" type="operator" />

        <CalcButton onClick={() => handleNumber('1')} label="1" />
        <CalcButton onClick={() => handleNumber('2')} label="2" />
        <CalcButton onClick={() => handleNumber('3')} label="3" />
        <CalcButton onClick={() => handleOperator('+')} label="+" type="operator" />

        <CalcButton onClick={() => handleNumber('0')} label="0" className={mode === 'scientific' ? "" : "col-span-2"} />
        <CalcButton onClick={() => handleNumber('.')} label="." />
        <CalcButton onClick={calculate} label="=" type="equals" className={mode === 'scientific' ? "col-span-3" : ""} />
      </div>
    );
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 transition-all">
      <div className="p-8 pb-4 text-right flex flex-col justify-end min-h-[180px] bg-gray-50/50 dark:bg-zinc-900/50 relative">
        <div className="text-sm font-medium text-gray-500 dark:text-zinc-400 h-6 overflow-hidden text-ellipsis mb-2">{formula}</div>
        <div className="text-5xl font-google font-medium text-gray-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">{display}</div>
        <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mode === 'ai' ? 'bg-indigo-500' : mode === 'formula' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mode} Mode</span>
        </div>
      </div>

      <div className="px-4 mb-2">
        <div className="flex bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-xl">
          {(['standard', 'scientific', 'ai', 'formula'] as CalcMode[]).map((m) => (
            <button 
              key={m} 
              onClick={() => setMode(m)} 
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${mode === m ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-zinc-900 overflow-y-auto max-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};

interface CalcButtonProps {
  label: string | React.ReactNode;
  onClick: () => void;
  type?: 'number' | 'operator' | 'action' | 'equals' | 'sci';
  className?: string;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, onClick, type = 'number', className = '' }) => {
  const baseClasses = "h-14 rounded-2xl font-google flex items-center justify-center transition-all active:scale-95";
  const typeClasses = {
    number: "bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 text-xl",
    operator: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-2xl font-bold",
    action: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-lg",
    equals: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 text-2xl font-bold",
    sci: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[11px] font-black"
  };
  return <button onClick={onClick} className={`${baseClasses} ${typeClasses[type]} ${className}`}>{label}</button>;
};

export default Calculator;