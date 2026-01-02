export const MODEL_CANDIDATES = [
  'gemini-2.0-flash-exp',   // Experimental 2.0
  'gemini-2.0-flash-001',   // Stable 2.0 (if available)
  'gemini-1.5-flash-latest',    // Fallback: Stable Flash
  'gemini-1.5-pro-latest'
];

export const DEFAULT_PROMPT = "The cat sat on the";
export const DEFAULT_TEMP = 0.7;
export const DEFAULT_TOP_K = 40;
export const MAX_HISTORY_ITEMS = 50;

export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
