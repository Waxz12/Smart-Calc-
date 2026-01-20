
import React, { useState, useRef, useEffect } from 'react';
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
  const [formulaInput, setFormulaInput] = useState('radius = 5\narea = pi * radius^2\narea');
  const [formulaResults, setFormulaResults] = useState<{line: string, result: string, isError: boolean}[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isDegree, setIsDegree] = useState(true);
  const [is2nd, setIs2nd] = useState(false);

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
    const base = lastResult ? display : (formula.includes('=') ? display : formula + display);
    const cleanBase = base.replace(/×/g, '*').replace(/÷/g, '/');
    setFormula(cleanBase + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const expr = (formula + display)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/e/g, 'e');
      
      const result = math.evaluate(expr);
      const formatted = math.format(result, { precision: 10 });
      addToHistory({ expression: formula + display, result: String(formatted) });
      setDisplay(String(formatted));
      setFormula(formula + display + ' =');
      setLastResult(String(formatted));
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleScientific = (func: string) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val) && !['π', 'e'].includes(func)) return;
      
      let res: any;
      let label = func;

      switch(func) {
        case 'sin': res = math.sin(isDegree ? math.unit(val, 'deg') : val); break;
        case 'cos': res = math.cos(isDegree ? math.unit(val, 'deg') : val); break;
        case 'tan': res = math.tan(isDegree ? math.unit(val, 'deg') : val); break;
        case 'asin': 
          res = math.asin(val); 
          if (isDegree) res = math.unit(res, 'rad').toNumber('deg');
          label = 'sin⁻¹';
          break;
        case 'acos': 
          res = math.acos(val); 
          if (isDegree) res = math.unit(res, 'rad').toNumber('deg');
          label = 'cos⁻¹';
          break;
        case 'atan': 
          res = math.atan(val); 
          if (isDegree) res = math.unit(res, 'rad').toNumber('deg');
          label = 'tan⁻¹';
          break;
        case 'sinh': res = math.sinh(val); break;
        case 'cosh': res = math.cosh(val); break;
        case 'tanh': res = math.tanh(val); break;
        case 'asinh': res = math.asinh(val); label = 'sinh⁻¹'; break;
        case 'acosh': res = math.acosh(val); label = 'cosh⁻¹'; break;
        case 'atanh': res = math.atanh(val); label = 'tanh⁻¹'; break;
        case 'log': res = math.log10(val); break;
        case 'ln': res = math.log(val); break;
        case '10ˣ': res = math.pow(10, val); break;
        case 'eˣ': res = math.exp(val); label = 'exp'; break;
        case '√': res = math.sqrt(val); break;
        case 'x²': res = math.square(val); break;
        case 'x³': res = math.pow(val, 3); break;
        case 'n!': res = math.factorial(val); break;
        case 'abs': res = math.abs(val); break;
        default: return;
      }
      
      const formatted = math.format(res, { precision: 10 });
      setDisplay(String(formatted));
      setFormula(`${label}(${val}) =`);
      setLastResult(String(formatted));
    } catch (e) { setDisplay('Error'); }
  };

  const runFormula = () => {
    const lines = formulaInput.split('\n');
    const parser = math.parser();
    const results: {line: string, result: string, isError: boolean}[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        results.push({ line: '', result: '', isError: false });
        return;
      }
      try {
        const res = parser.evaluate(trimmed);
        const formatted = res !== undefined ? math.format(res, { precision: 10 }) : 'defined';
        results.push({ line: trimmed, result: String(formatted), isError: false });
      } catch (err: any) {
        results.push({ line: trimmed, result: err.message, isError: true });
      }
    });

    setFormulaResults(results);
    const lastValid = [...results].reverse().find(r => !r.isError && r.result !== 'defined');
    if (lastValid) {
      setDisplay(lastValid.result);
      addToHistory({ expression: 'Formula Block', result: lastValid.result });
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 transition-all flex flex-col max-h-[90vh]">
      {/* Display Area */}
      <div className="p-8 pb-4 text-right flex flex-col justify-end min-h-[140px] bg-gray-50/50 dark:bg-zinc-900/50 relative">
        <div className="text-sm font-medium text-gray-400 dark:text-zinc-500 mb-1 h-5 overflow-hidden truncate">{formula}</div>
        <div className="text-5xl font-google font-medium text-gray-900 dark:text-white truncate">{display}</div>
        <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mode === 'ai' ? 'bg-indigo-500' : mode === 'formula' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mode}</span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 mb-2">
        <div className="flex bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-2xl">
          {['standard', 'scientific', 'ai', 'formula'].map((m) => (
            <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${mode === m ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        {mode === 'ai' && (
          <div className="space-y-4">
            <textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="e.g. 'Calculate mortgage for $300k at 4% for 30 years'" className="w-full h-24 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
            <button onClick={() => onAIQuery(aiInput)} disabled={isProcessingAI || !aiInput.trim()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {isProcessingAI ? 'Thinking...' : 'Solve with AI'}
            </button>
            {aiDetail && !isProcessingAI && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl space-y-2 border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Logic Breakdown</p>
                {aiDetail.steps.map((s, i) => <p key={i} className="text-xs text-gray-600 dark:text-zinc-400">• {s}</p>)}
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 italic mt-2">Reasoning: {aiDetail.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {mode === 'formula' && (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea 
                value={formulaInput} 
                onChange={(e) => setFormulaInput(e.target.value)} 
                placeholder="Write your formulas line by line..."
                className="w-full h-48 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-mono resize-none leading-relaxed"
              />
            </div>
            <button onClick={runFormula} className="w-full py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform">
              Execute Script
            </button>
            {formulaResults.length > 0 && (
              <div className="space-y-2">
                {formulaResults.map((res, i) => res.line && (
                  <div key={i} className={`p-3 rounded-xl flex items-center justify-between gap-4 border ${res.isError ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800'}`}>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono truncate">{res.line}</span>
                    <span className={`text-xs font-bold ${res.isError ? 'text-red-500' : 'text-amber-600'}`}>= {res.result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'scientific' && (
          <div className="grid grid-cols-5 gap-2 animate-in slide-in-from-top duration-300">
            <CalcBtn label="2nd" onClick={() => setIs2nd(!is2nd)} type="sci" className={is2nd ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'} />
            <CalcBtn label={isDegree ? 'Deg' : 'Rad'} onClick={() => setIsDegree(!isDegree)} type="sci" />
            <CalcBtn label={is2nd ? 'sin⁻¹' : 'sin'} onClick={() => handleScientific(is2nd ? 'asin' : 'sin')} type="sci" />
            <CalcBtn label={is2nd ? 'cos⁻¹' : 'cos'} onClick={() => handleScientific(is2nd ? 'acos' : 'cos')} type="sci" />
            <CalcBtn label={is2nd ? 'tan⁻¹' : 'tan'} onClick={() => handleScientific(is2nd ? 'atan' : 'tan')} type="sci" />
            
            <CalcBtn label={is2nd ? 'sinh⁻¹' : 'sinh'} onClick={() => handleScientific(is2nd ? 'asinh' : 'sinh')} type="sci" />
            <CalcBtn label={is2nd ? 'cosh⁻¹' : 'cosh'} onClick={() => handleScientific(is2nd ? 'acosh' : 'cosh')} type="sci" />
            <CalcBtn label={is2nd ? 'tanh⁻¹' : 'tanh'} onClick={() => handleScientific(is2nd ? 'atanh' : 'tanh')} type="sci" />
            <CalcBtn label={is2nd ? '10ˣ' : 'log'} onClick={() => handleScientific(is2nd ? '10ˣ' : 'log')} type="sci" />
            <CalcBtn label={is2nd ? 'eˣ' : 'ln'} onClick={() => handleScientific(is2nd ? 'eˣ' : 'ln')} type="sci" />

            <CalcBtn label="x²" onClick={() => handleScientific('x²')} type="sci" />
            <CalcBtn label="x³" onClick={() => handleScientific('x³')} type="sci" />
            <CalcBtn label="^" onClick={() => handleOperator('^')} type="sci" className="font-bold text-lg" />
            <CalcBtn label="√" onClick={() => handleScientific('√')} type="sci" />
            <CalcBtn label="n!" onClick={() => handleScientific('n!')} type="sci" />

            <CalcBtn label="π" onClick={() => handleNumber('π')} type="sci" className="font-google" />
            <CalcBtn label="e" onClick={() => handleNumber('e')} type="sci" className="font-google italic" />
            <CalcBtn label="abs" onClick={() => handleScientific('abs')} type="sci" />
            <CalcBtn label="(" onClick={() => handleNumber('(')} type="sci" />
            <CalcBtn label=")" onClick={() => handleNumber(')')} type="sci" />
          </div>
        )}

        {(mode === 'standard' || mode === 'scientific') && (
          <div className="grid grid-cols-4 gap-2">
            <CalcBtn label="C" onClick={() => {setDisplay('0'); setFormula('');}} type="action" className="text-red-500 font-bold" />
            <CalcBtn label="⌫" onClick={() => setDisplay(display.length > 1 ? display.slice(0,-1) : '0')} type="action" />
            <CalcBtn label="%" onClick={() => handleOperator('%')} type="action" />
            <CalcBtn label="÷" onClick={() => handleOperator('÷')} type="operator" />
            
            <CalcBtn label="7" onClick={() => handleNumber('7')} />
            <CalcBtn label="8" onClick={() => handleNumber('8')} />
            <CalcBtn label="9" onClick={() => handleNumber('9')} />
            <CalcBtn label="×" onClick={() => handleOperator('×')} type="operator" />
            
            <CalcBtn label="4" onClick={() => handleNumber('4')} />
            <CalcBtn label="5" onClick={() => handleNumber('5')} />
            <CalcBtn label="6" onClick={() => handleNumber('6')} />
            <CalcBtn label="-" onClick={() => handleOperator('-')} type="operator" />
            
            <CalcBtn label="1" onClick={() => handleNumber('1')} />
            <CalcBtn label="2" onClick={() => handleNumber('2')} />
            <CalcBtn label="3" onClick={() => handleNumber('3')} />
            <CalcBtn label="+" onClick={() => handleOperator('+')} type="operator" />
            
            <CalcBtn label="0" onClick={() => handleNumber('0')} className="col-span-1" />
            <CalcBtn label="." onClick={() => handleNumber('.')} />
            <CalcBtn label="=" onClick={calculate} type="equals" className="col-span-2" />
          </div>
        )}
      </div>
    </div>
  );
};

const CalcBtn = ({ label, onClick, type = 'num', className = '' }: any) => {
  const styles: any = {
    num: "bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xl",
    operator: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-2xl font-bold",
    action: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-lg",
    equals: "bg-indigo-600 text-white text-2xl font-bold shadow-lg shadow-indigo-600/20",
    sci: "bg-zinc-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-400 text-[10px] font-black uppercase h-10"
  };
  const hClass = type === 'sci' ? 'h-10' : 'h-14';
  return <button onClick={onClick} className={`${hClass} rounded-2xl flex items-center justify-center active:scale-95 transition-all duration-75 ${styles[type]} ${className}`}>{label}</button>;
};

export default Calculator;
