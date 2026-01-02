import React, { useState } from 'react';
import { Settings, Play, Pause, RotateCcw, Eye, EyeOff, Info, Split } from 'lucide-react';

interface ControlPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  topK: number;
  setTopK: (k: number) => void;
  isAutoGenerating: boolean;
  isLoading: boolean;
  onGenerate: () => void;
  onToggleAuto: () => void;
  onReset: () => void;
  currentModel: string | null;
  // Comparison props
  isComparisonMode: boolean;
  onToggleComparison: () => void;
  temperature2: number;
  setTemperature2: (temp: number) => void;
}

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle">
    <Info size={13} className="text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-gray-900/95 backdrop-blur-sm text-gray-100 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 shadow-xl border border-gray-700 z-50 pointer-events-none text-left leading-relaxed font-normal">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
    </div>
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  apiKey, setApiKey,
  prompt, setPrompt,
  temperature, setTemperature,
  topK, setTopK,
  isAutoGenerating, isLoading,
  onGenerate, onToggleAuto, onReset,
  currentModel,
  isComparisonMode, onToggleComparison,
  temperature2, setTemperature2
}) => {
  const [showKey, setShowKey] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6 relative z-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="w-full mr-2">
           <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            Gemini API Key
            <InfoTooltip text="Required to access the Gemini API. Your key is stored securely in your browser's local storage and is never sent to our servers, only directly to Google." />
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Get Key
            </a>
          </label>
          <div className="relative group">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key..."
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-shadow"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              title={showKey ? "Hide API Key" : "Show API Key"}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors mt-6 ${showSettings ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          title={showSettings ? "Hide Advanced Settings" : "Show Advanced Settings"}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
          Initial Prompt
          <InfoTooltip text="The starting text (context) for the model. The model calculates the probability of the next token based on this entire sequence." />
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading || isAutoGenerating}
          placeholder="e.g., The cat sat on the"
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none transition-shadow"
        />
      </div>

      {/* Advanced Settings */}
      {showSettings && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100 animate-fade-in">
          
          {/* Comparison Mode Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
             <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
               <div className={`p-1 rounded ${isComparisonMode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                 <Split size={14} />
               </div>
               Comparison Mode
               <InfoTooltip text="Enables generating two sequences side-by-side with different temperature settings to compare their outputs." />
             </label>
             <button
               onClick={onToggleComparison}
               disabled={isLoading || isAutoGenerating}
               className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                 isComparisonMode ? 'bg-blue-600' : 'bg-gray-200'
               }`}
             >
               <span
                 className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                   isComparisonMode ? 'translate-x-5' : 'translate-x-1'
                 }`}
               />
             </button>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 flex items-center">
                {isComparisonMode ? 'Temperature A' : 'Temperature'}
                <InfoTooltip text="Controls randomness for the first sequence." />
              </label>
              <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            {!isComparisonMode && (
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>Precise (0.0)</span>
                <span>Creative (2.0)</span>
              </div>
            )}
          </div>

          {isComparisonMode && (
            <div className="animate-fade-in">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 flex items-center">
                  Temperature B
                  <InfoTooltip text="Controls randomness for the second sequence." />
                </label>
                <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{temperature2.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature2}
                onChange={(e) => setTemperature2(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>Precise (0.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 flex items-center">
                Top-K
                <InfoTooltip text="Limits the selection pool to the top K most likely next tokens." />
              </label>
              <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 flex justify-between items-center">
            <span>Model Strategy</span>
             {currentModel ? (
                <span className="text-green-600 font-mono bg-green-50 px-1.5 py-0.5 rounded border border-green-100">{currentModel}</span>
             ) : (
               <span className="text-gray-400 italic">Auto-detecting...</span>
             )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onGenerate}
            disabled={isLoading || isAutoGenerating}
            title={!apiKey ? "Enter API Key to generate" : "Generate exactly one token and stop."}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            {isLoading ? 'Generating...' : isComparisonMode ? 'Next Token (Both)' : 'Next Token'}
          </button>
          
          <button
            onClick={onToggleAuto}
            title={isAutoGenerating ? "Stop the generation loop" : "Continuously generate tokens one by one until stopped"}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all shadow-sm active:scale-95 border disabled:opacity-50 disabled:cursor-not-allowed ${
              isAutoGenerating 
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isAutoGenerating ? (
              <>
                <Pause size={18} fill="currentColor" /> Stop Auto
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Auto-Generate
              </>
            )}
          </button>
        </div>
        
        <button
          onClick={onReset}
          title="Clear all generated tokens and history"
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw size={14} /> Reset Playground
        </button>
      </div>
    </div>
  );
};