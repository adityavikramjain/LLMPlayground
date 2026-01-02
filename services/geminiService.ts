import { MODEL_CANDIDATES, API_BASE_URL } from '../constants';
import { GeminiResponse, TokenProb } from '../types';

interface GenerateParams {
  apiKey: string;
  prompt: string;
  temperature: number;
  topK: number;
  preferredModel?: string | null;
}

interface GenerateResult {
  token: string;
  probabilities: TokenProb[];
  modelUsed: string;
}

// Helper to calculate probability from logprob
const logprobToProb = (logprob: number): number => {
  return Math.exp(logprob) * 100;
};

// Direct fetch implementation to ensure we get the exact logprobs structure 
// that might be abstracted away or typed differently in the generic SDK.
async function callGeminiRaw(model: string, params: GenerateParams): Promise<GenerateResult> {
  const url = `${API_BASE_URL}/${model}:generateContent?key=${params.apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: params.prompt }]
    }],
    systemInstruction: {
      parts: [{ text: "You are a text completion engine. Your task is to continue the input text seamlessly. Do not repeat the input. Do not explain your output. Just provide the next immediate continuation. preserve logical spacing (e.g. start with a space if continuing a sentence word)." }]
    },
    generationConfig: {
      temperature: params.temperature,
      topK: params.topK,
      maxOutputTokens: 1,
      candidateCount: 1,
      responseLogprobs: true,
      logprobs: 10
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates returned from API");
  }

  const candidate = data.candidates[0];
  const generatedToken = candidate.content.parts[0]?.text || "";

  // The logprobs are in candidate.logprobsResult.topCandidates
  // topCandidates is an array where index 0 corresponds to the first generated token
  const topCandidatesResult = candidate.logprobsResult?.topCandidates?.[0]?.candidates;

  if (!topCandidatesResult) {
    // Fallback if logprobs are missing (shouldn't happen with correct config)
    console.warn("Logprobs missing in response", data);
    return {
      token: generatedToken,
      probabilities: [],
      modelUsed: model
    };
  }

  // Deduplicate candidates by token text.
  // The API might return different token IDs that map to the same string, or duplicates.
  // We keep the first occurrence (highest probability) for the visualization.
  const uniqueCandidates = new Map<string, TokenProb>();
  
  for (const c of topCandidatesResult) {
      if (!uniqueCandidates.has(c.token)) {
          uniqueCandidates.set(c.token, {
            token: c.token,
            logprob: c.logProbability,
            probability: logprobToProb(c.logProbability)
          });
      }
  }
  
  const probabilities = Array.from(uniqueCandidates.values());

  return {
    token: generatedToken,
    probabilities,
    modelUsed: model
  };
}

export const generateNextToken = async (params: GenerateParams): Promise<GenerateResult> => {
  let error: Error | null = null;
  
  // Create a priority list: Preferred model first, then the list
  const candidateModels = [...MODEL_CANDIDATES];
  
  // If we have a working model from before that isn't in the list, try it first
  if (params.preferredModel && !candidateModels.includes(params.preferredModel)) {
    candidateModels.unshift(params.preferredModel);
  } else if (params.preferredModel) {
    // Move preferred to top
    const idx = candidateModels.indexOf(params.preferredModel);
    if (idx > -1) {
      candidateModels.splice(idx, 1);
      candidateModels.unshift(params.preferredModel);
    }
  }

  // Iterate through models
  for (const model of candidateModels) {
    try {
      console.log(`Attempting generation with model: ${model}`);
      const result = await callGeminiRaw(model, params);
      return result;
    } catch (e: any) {
      console.warn(`Model ${model} failed:`, e.message);
      error = e;
      // If it's an API Key error, don't try other models, just fail immediately
      if (e.message.includes('API_KEY_INVALID') || e.message.includes('key')) {
        throw e;
      }
      // Continue to next model
    }
  }

  throw error || new Error("All model candidates failed.");
};