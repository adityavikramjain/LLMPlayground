import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TokenProb } from '../types';

interface ProbabilityChartProps {
  data: TokenProb[];
  chosenToken?: string;
  onBarClick?: (token: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm z-50">
        <p className="font-bold mb-1 text-gray-800 border-b pb-1">Token: <span className="font-mono bg-gray-100 px-1 rounded">"{data.token}"</span></p>
        <div className="space-y-1 mt-2">
            <p className="flex justify-between gap-4">
                <span className="text-gray-600">Probability:</span>
                <span className="font-mono text-blue-600 font-bold">{data.probability.toFixed(2)}%</span>
            </p>
            <p className="flex justify-between gap-4">
                <span className="text-gray-600">Logprob:</span>
                <span className="font-mono text-gray-500">{data.logprob.toFixed(4)}</span>
            </p>
        </div>
      </div>
    );
  }
  return null;
};

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ data, chosenToken, onBarClick }) => {
  // Sort data by probability descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);

  // Normalize token text for display to handle newlines/spaces visible
  const formatTokenLabel = (token: string) => {
    // If token is purely whitespace, describe it clearly
    if (token === ' ') return '␣ (Space)';
    if (token === '\n') return '↵ (Newline)';
    // Escape standard invisible chars for other strings
    return token.replace(/\n/g, '↵').replace(/\t/g, '⇥');
  };

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between shrink-0">
        <span>Top 10 Predictions</span>
        {chosenToken && (
           <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-mono truncate max-w-[150px]" title={`Chosen: "${chosenToken}"`}>
             Chosen: "{formatTokenLabel(chosenToken)}"
           </span>
        )}
      </h3>
      <div className="flex-1 min-h-0 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            barSize={24}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis 
              type="category" 
              dataKey="token" 
              width={100}
              tickFormatter={(val) => {
                 const formatted = formatTokenLabel(val);
                 return formatted.length > 12 ? formatted.substring(0, 12) + '...' : formatted;
              }}
              tick={{fontSize: 11, fontFamily: 'monospace', fill: '#475569'}} 
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="probability" radius={[0, 4, 4, 0]} onClick={(data) => onBarClick && onBarClick(data.token)} cursor="pointer">
              {sortedData.map((entry, index) => {
                // Check if this specific entry is the chosen one
                const isChosen = entry.token === chosenToken;
                
                // Gradient logic: Blue that gets lighter/desaturated as probability rank drops
                // Rank 0: Primary Blue (approx tailwind blue-600)
                // Lower Ranks: Lighter blue
                // Using HSL for smoother gradient
                const lightness = 50 + (index * 4); // 50% to 90%
                const blueBase = `hsl(217, 91%, ${lightness}%)`; 
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isChosen ? '#22c55e' : blueBase} 
                    stroke={isChosen ? '#16a34a' : 'none'}
                    strokeWidth={isChosen ? 1 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};