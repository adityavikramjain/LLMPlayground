import React, { useRef, useEffect, useState } from 'react';
import { GenerationStep } from '../types';
import { RefreshCw, Thermometer, ListFilter, AlignLeft, BarChart2 } from 'lucide-react';

interface SequenceDisplayProps {
  basePrompt: string;
  generatedSteps: GenerationStep[];
  onTokenClick: (stepId: string) => void;
  activeStepId: string | null;
  isLoading: boolean;
  title?: string;
  className?: string;
}

export const SequenceDisplay: React.FC<SequenceDisplayProps> = ({ 
  basePrompt, 
  generatedSteps, 
  onTokenClick, 
  activeStepId,
  isLoading,
  title = "Generated Sequence",
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [hoveredStep, setHoveredStep] = useState<GenerationStep | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Auto-scroll to bottom when new tokens are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [generatedSteps.length]);

  const handleMouseEnter = (e: React.MouseEvent, step: GenerationStep) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 288; // w-72 is approx 288px
    const viewportWidth = window.innerWidth;
    
    // Default positioning logic
    let top = rect.top - 12;
    let left = rect.left + (rect.width / 2);
    let xPercent = -50;
    let yPercent = -100;

    // 1. Horizontal Constraints
    const halfWidth = tooltipWidth / 2;
    // Check Left Edge
    if (left - halfWidth < 10) {
        left = Math.max(10, rect.left); // Anchor near left
        xPercent = 0;
    } 
    // Check Right Edge
    else if (left + halfWidth > viewportWidth - 10) {
        left = Math.min(viewportWidth - 10, rect.right); // Anchor near right
        xPercent = -100;
    }

    // 2. Vertical Constraints
    // If top is too close to viewport top (assuming tooltip height ~280px), flip to bottom
    if (top < 300) {
       top = rect.bottom + 12;
       yPercent = 0;
    }

    setHoveredStep(step);
    setTooltipStyle({
      top,
      left,
      transform: `translate(${xPercent}%, ${yPercent}%)`
    });
  };

  const handleMouseLeave = () => {
    setHoveredStep(null);
  };

  // Helper to format token for tooltip display (make spaces visible)
  const formatTokenForTooltip = (token: string) => {
     if (token === ' ') return '␣';
     if (token === '\n') return '↵';
     // Replace spaces with middle dot for visibility in list
     return token.replace(/\n/g, '↵').replace(/ /g, '·');
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative ${className}`}>
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          {title}
        </h2>
        <span className="text-xs font-mono text-gray-500">
          {generatedSteps.length} tokens
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 p-6 overflow-y-auto font-mono text-lg text-gray-800 break-words leading-relaxed"
      >
        <span className="text-gray-400 whitespace-pre-wrap">{basePrompt}</span>
        
        {generatedSteps.map((step, index) => {
          const isSelected = activeStepId === step.id;
          // Use alternating subtle backgrounds to distinguish tokens
          const bgClass = isSelected 
            ? 'bg-blue-200 text-blue-900 ring-2 ring-blue-400 ring-opacity-50 z-10' 
            : index % 2 === 0 ? 'bg-indigo-50/60' : 'bg-purple-50/60';
          
          return (
            <span
              key={step.id}
              onClick={() => onTokenClick(step.id)}
              onMouseEnter={(e) => handleMouseEnter(e, step)}
              onMouseLeave={handleMouseLeave}
              className={`
                cursor-pointer transition-all duration-200 whitespace-pre-wrap relative inline-block rounded-sm px-[1px]
                border-b-2 border-transparent 
                hover:border-blue-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:bg-blue-50 hover:text-blue-700 hover:z-20
                ${bgClass}
              `}
            >
              {step.chosenToken}
            </span>
          );
        })}
        
        {isLoading && (
          <span className="inline-flex items-center ml-2 text-gray-400 animate-pulse whitespace-nowrap">
            <RefreshCw className="w-4 h-4 animate-spin mr-1" />
          </span>
        )}
        
        {/* Blinking cursor effect at the end */}
        {!isLoading && <span className="inline-block w-2 h-5 bg-blue-500 ml-0.5 animate-pulse align-middle"></span>}
      </div>

      {/* Floating Tooltip Portal */}
      {hoveredStep && (
        <div 
          className="fixed z-50 bg-gray-900/95 text-white p-3 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700 pointer-events-none w-72 animate-fade-in transition-opacity duration-150"
          style={tooltipStyle}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2 border-b border-gray-700 pb-2">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
              Step Info
            </div>
            <div className="flex gap-2 text-[10px] text-gray-400 font-mono">
               <span className="flex items-center gap-0.5"><Thermometer size={10}/> {hoveredStep.temperature}</span>
               <span className="flex items-center gap-0.5"><ListFilter size={10}/> K:{hoveredStep.topK}</span>
            </div>
          </div>

          {/* Context Snippet */}
          <div className="mb-3">
             <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
               <AlignLeft size={10} /> Context (Full Prompt)
             </div>
             <div className="text-xs font-mono text-gray-300 bg-gray-800 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words border border-gray-700">
               {hoveredStep.promptAtStep.replace(/\n/g, '↵\n')}
             </div>
          </div>

          {/* Probability Distribution Chart (Simplified) */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1.5">
              <span className="flex items-center gap-1"><BarChart2 size={10} /> Top 5 Probabilities</span>
              <span className="text-[9px] uppercase tracking-wide opacity-70">Log-Probs</span>
            </div>
            <div className="space-y-2">
              {hoveredStep.topCandidates.slice(0, 5).map((cand, idx) => {
                const isChosen = cand.token === hoveredStep.chosenToken;
                // Determine bar color
                const barColor = isChosen ? 'bg-green-500' : 'bg-blue-500';
                const textColor = isChosen ? 'text-green-400 font-bold' : 'text-gray-300';
                
                return (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[10px] font-mono leading-none">
                      <span className={`truncate max-w-[140px] ${textColor}`}>"{formatTokenForTooltip(cand.token)}"</span>
                      <span className="text-gray-400">{cand.probability.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.max(cand.probability, 1)}%`, opacity: isChosen ? 1 : 0.7 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Tip */}
          <div className="mt-3 pt-1 border-t border-gray-700 text-[9px] text-gray-500 text-center italic">
            Click token to view full interactive chart
          </div>
        </div>
      )}
    </div>
  );
};