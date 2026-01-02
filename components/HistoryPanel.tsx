import React, { useEffect } from 'react';
import { GenerationStep } from '../types';
import { ChevronDown, ChevronRight, BarChart2, AlignLeft } from 'lucide-react';

interface HistoryPanelProps {
  history: GenerationStep[];
  activeStepId: string | null;
  onStepClick: (stepId: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, activeStepId, onStepClick }) => {
  
  // Auto-scroll to the active step when it changes (e.g., via SequenceDisplay click)
  useEffect(() => {
    if (activeStepId) {
      const element = document.getElementById(`history-step-${activeStepId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeStepId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          Generation History
        </h2>
      </div>
      
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No tokens generated yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.slice().reverse().map((step, index) => {
              const isActive = activeStepId === step.id;
              const prob = step.topCandidates.find(c => c.token === step.chosenToken)?.probability.toFixed(1) || '0.0';
              
              return (
                <div 
                  key={step.id}
                  id={`history-step-${step.id}`}
                  className={`transition-all duration-300 border-l-4 ${
                    isActive 
                      ? 'bg-blue-50 border-blue-500 shadow-inner' 
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => onStepClick(step.id)}
                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {history.length - index}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-semibold text-gray-800">
                           "{step.chosenToken.replace(/\n/g, '↵')}"
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><BarChart2 size={10} /> {prob}%</span>
                          <span>•</span>
                          <span>Temp: {step.temperature}</span>
                        </div>
                      </div>
                    </div>
                    {isActive ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </button>
                  
                  {isActive && (
                    <div className="px-4 pb-4 pl-14 animate-fade-in">
                      {/* Context Prompt Display */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
                          <AlignLeft size={10} />
                          Context (Prompt Used)
                        </div>
                        <div className="text-xs font-mono text-gray-600 bg-white p-2 rounded border border-gray-200 break-words whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar shadow-sm">
                           {step.promptAtStep}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Top Alternatives</div>
                      <div className="space-y-1">
                        {step.topCandidates.slice(0, 3).map((cand, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded">"{cand.token.replace(/\n/g, '↵')}"</span>
                            <span className="text-gray-500">{cand.probability.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};