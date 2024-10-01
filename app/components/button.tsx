import React, { useState } from 'react';
import { extractChartData } from '../../lib/chartDataExtractor';

interface AnalyzeButtonProps {
  chart: any; // We'll use 'any' for now, but you might want to define a more specific type
}

const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ chart }) => {
  const [analysis, setAnalysis] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyzeClick = async () => {
    setIsLoading(true);
    try {
      const chartData = await extractChartData(chart);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chartData }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error analyzing chart:', error);
      setAnalysis('An error occurred while analyzing the chart.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAnalyzeClick}
        className="bg-[#77be44] hover:bg-[#69a93d] text-black font-semibold py-2 px-4 rounded text-sm transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">AI Technical Analysis</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 bg-[#77be44] hover:bg-[#69a93d] text-black font-semibold py-2 px-4 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyzeButton;
