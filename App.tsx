import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SequenceDisplay } from './components/SequenceDisplay';
import { ProbabilityChart } from './components/ProbabilityChart';
import { HistoryPanel } from './components/HistoryPanel';
import { generateNextToken } from './services/geminiService';
import { AppState, GenerationStep } from './types';
import { DEFAULT_PROMPT, DEFAULT_TEMP, DEFAULT_TOP_K, MAX_HISTORY_ITEMS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [apiKey, setApiKey] = useState<string>('');
  const [basePrompt, setBasePrompt] = useState<string>(DEFAULT_PROMPT);
  const [generatedTokens, setGeneratedTokens] = useState<GenerationStep[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(DEFAULT_TEMP);
  const [topK, setTopK] = useState<number>(DEFAULT_TOP_K);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Comparison Mode State
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [temperature2, setTemperature2] = useState<number>(1.0); // Default to creative for contrast
  const [generatedTokens2, setGeneratedTokens2] = useState<GenerationStep[]>([]);

  // Visual state
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Refs for auto-generation loop to access latest state
  const autoGenRef = useRef<boolean>(false);
  const generatedTokensRef = useRef<GenerationStep[]>([]);
  const generatedTokens2Ref = useRef<GenerationStep[]>([]);
  const promptRef = useRef<string>(basePrompt);

  // --- Effects ---

  // Load from LocalStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_preferred_model');
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setCurrentModel(savedModel);
  }, []);

  // Update Refs
  useEffect(() => {
    autoGenRef.current = isAutoGenerating;
    generatedTokensRef.current = generatedTokens;
    generatedTokens2Ref.current = generatedTokens2;
    promptRef.current = basePrompt;
  }, [isAutoGenerating, generatedTokens, generatedTokens2, basePrompt]);

  // --- Logic ---

  const handleGenerateNext = useCallback(async () => {
    if (!apiKey) {
      setError("Please enter a valid Gemini API Key.");
      return;
    }

    setIsLoading(true);
    setError(null);
    localStorage.setItem('gemini_api_key', apiKey);

    try {
      // 1. Prepare Request A
      const previousTokensA = generatedTokensRef.current.map(step => step.chosenToken).join('');
      const fullPromptA = promptRef.current + previousTokensA;
      
      const promises = [
        generateNextToken({
          apiKey,
          prompt: fullPromptA,
          temperature,
          topK,
          preferredModel: currentModel
        })
      ];

      // 2. Prepare Request B (if comparison)
      if (isComparisonMode) {
        const previousTokensB = generatedTokens2Ref.current.map(step => step.chosenToken).join('');
        const fullPromptB = promptRef.current + previousTokensB;
        promises.push(
          generateNextToken({
            apiKey,
            prompt: fullPromptB,
            temperature: temperature2,
            topK,
            preferredModel: currentModel
          })
        );
      }

      const results = await Promise.all(promises);
      const resultA = results[0];
      const resultB = isComparisonMode ? results[1] : null;

      // 3. Process Result A
      if (resultA.modelUsed !== currentModel) {
        setCurrentModel(resultA.modelUsed);
        localStorage.setItem('gemini_preferred_model', resultA.modelUsed);
      }

      const newStepA: GenerationStep = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        promptAtStep: fullPromptA,
        chosenToken: resultA.token,
        topCandidates: resultA.probabilities,
        temperature,
        topK,
        modelUsed: resultA.modelUsed
      };

      setGeneratedTokens(prev => {
        const next = [...prev, newStepA];
        if (next.length > MAX_HISTORY_ITEMS) return next.slice(next.length - MAX_HISTORY_ITEMS);
        return next;
      });
      
      // 4. Process Result B
      if (resultB) {
        // Construct prompt for B step context
        const previousTokensB = generatedTokens2Ref.current.map(step => step.chosenToken).join('');
        const fullPromptB = promptRef.current + previousTokensB;

        const newStepB: GenerationStep = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          promptAtStep: fullPromptB,
          chosenToken: resultB.token,
          topCandidates: resultB.probabilities,
          temperature: temperature2,
          topK,
          modelUsed: resultB.modelUsed
        };

        setGeneratedTokens2(prev => {
          const next = [...prev, newStepB];
          if (next.length > MAX_HISTORY_ITEMS) return next.slice(next.length - MAX_HISTORY_ITEMS);
          return next;
        });
      }

      // Highlight the new step (Focus on A by default, user can click B)
      setActiveStepId(newStepA.id);

      // Auto-generation recursion
      if (autoGenRef.current) {
        setTimeout(() => {
          if (autoGenRef.current) handleGenerateNext();
        }, 800);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
      setIsAutoGenerating(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, temperature, temperature2, topK, currentModel, isComparisonMode]);

  // Trigger for auto-gen button
  const toggleAutoGenerate = () => {
    // Immediate check for API key before toggling state
    if (!apiKey) {
      setError("Please enter a valid Gemini API Key to start auto-generation.");
      return;
    }
    
    const nextState = !isAutoGenerating;
    setIsAutoGenerating(nextState);
    if (nextState && !isLoading) {
      handleGenerateNext();
    }
  };

  const handleReset = () => {
    setIsAutoGenerating(false);
    setGeneratedTokens([]);
    setGeneratedTokens2([]);
    setActiveStepId(null);
    setError(null);
    setBasePrompt(DEFAULT_PROMPT);
  };

  const handleToggleComparison = () => {
    // Reset when toggling modes to ensure clean state
    handleReset();
    setIsComparisonMode(!isComparisonMode);
  };

  const handleStepClick = (stepId: string) => {
    setActiveStepId(stepId);
  };

  // Determine which data to show in chart
  // Check both arrays
  const activeStep = generatedTokens.find(s => s.id === activeStepId) || generatedTokens2.find(s => s.id === activeStepId);
  const chartData = activeStep ? activeStep.topCandidates : [];
  const chosenToken = activeStep ? activeStep.chosenToken : undefined;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">LLM Auto-Regression Playground</h1>
            <h1 className="font-bold text-lg tracking-tight text-gray-900 sm:hidden">LLM Playground</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
             {currentModel && (
               <span className="hidden sm:inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                 Model: {currentModel}
               </span>
             )}
             <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">Gemini API</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Controls (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <ControlPanel 
              apiKey={apiKey} setApiKey={setApiKey}
              prompt={basePrompt} setPrompt={setBasePrompt}
              temperature={temperature} setTemperature={setTemperature}
              topK={topK} setTopK={setTopK}
              isAutoGenerating={isAutoGenerating}
              isLoading={isLoading}
              onGenerate={handleGenerateNext}
              onToggleAuto={toggleAutoGenerate}
              onReset={handleReset}
              currentModel={currentModel}
              // Comparison Props
              isComparisonMode={isComparisonMode}
              onToggleComparison={handleToggleComparison}
              temperature2={temperature2}
              setTemperature2={setTemperature2}
            />
            
            {!isComparisonMode && (
              <div className="h-[400px]">
                <HistoryPanel 
                  history={generatedTokens}
                  activeStepId={activeStepId}
                  onStepClick={handleStepClick}
                />
              </div>
            )}
          </div>

          {/* Middle Column: Visualizations (9 cols) */}
          <div className="lg:col-span-9 space-y-6 flex flex-col">
            
            {isComparisonMode ? (
              // Comparison Grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                 <div className="flex flex-col h-[400px] md:h-auto">
                    <SequenceDisplay 
                      basePrompt={basePrompt}
                      generatedSteps={generatedTokens}
                      onTokenClick={handleStepClick}
                      activeStepId={activeStepId}
                      isLoading={isLoading}
                      title={`Seq A (Temp: ${temperature})`}
                      className="h-full border-blue-200"
                    />
                 </div>
                 <div className="flex flex-col h-[400px] md:h-auto">
                    <SequenceDisplay 
                      basePrompt={basePrompt}
                      generatedSteps={generatedTokens2}
                      onTokenClick={handleStepClick}
                      activeStepId={activeStepId}
                      isLoading={isLoading}
                      title={`Seq B (Temp: ${temperature2})`}
                      className="h-full border-indigo-200"
                    />
                 </div>
              </div>
            ) : (
              // Single View
              <div className="flex-1 min-h-[500px]">
                <SequenceDisplay 
                  basePrompt={basePrompt}
                  generatedSteps={generatedTokens}
                  onTokenClick={handleStepClick}
                  activeStepId={activeStepId}
                  isLoading={isLoading}
                  className="h-full"
                />
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              <p className="flex items-center gap-2 font-medium mb-1">
                <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded text-xs">How it works</span>
                {isComparisonMode ? 'Temperature Comparison' : 'Auto-Regression Loop'}
              </p>
              <p className="opacity-90 leading-relaxed">
                {isComparisonMode 
                  ? "Two separate generation chains are running with different temperature settings. Notice how higher temperatures usually lead to more diverse and unpredictable tokens, while lower temperatures remain more deterministic."
                  : "The model reads the entire sequence (Original Prompt + Generated Tokens) to calculate the probability of the next token. It then samples one token based on your temperature settings and appends it."
                }
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default App;