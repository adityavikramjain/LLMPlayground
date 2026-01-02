export interface TokenProb {
  token: string;
  logprob: number;
  probability: number; // percentage 0-100
}

export interface GenerationStep {
  id: string;
  timestamp: number;
  promptAtStep: string;
  chosenToken: string;
  topCandidates: TokenProb[];
  temperature: number;
  topK: number;
  modelUsed: string;
}

export interface AppState {
  apiKey: string;
  basePrompt: string;
  generatedTokens: GenerationStep[]; // The sequence of generated tokens
  isLoading: boolean;
  autoGenerate: boolean;
  temperature: number;
  topK: number;
  currentModel: string | null;
  error: string | null;
}

// Specific types for the raw Gemini API response structure
export interface GeminiCandidate {
  content: {
    parts: { text: string }[];
  };
  logprobsResult?: {
    // The top candidates for each generated token position
    topCandidates?: {
      // The list of candidate tokens for this position
      candidates: {
        token: string;
        logProbability: number;
      }[];
    }[];
    // The chosen candidate for each generated token position
    chosenCandidates?: {
        token: string;
        logProbability: number;
    }[];
  };
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
}