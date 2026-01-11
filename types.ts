
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  isAI?: boolean;
}

export interface AIResponse {
  result: number | string;
  steps: string[];
  reasoning: string;
  formulaUsed?: string;
  error?: string;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export type CalcMode = 'standard' | 'scientific' | 'ai' | 'formula';
