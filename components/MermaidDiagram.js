'use client';

import { useEffect, useRef, useState, memo } from 'react';

let mermaidInitialized = false;

function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const idRef = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const mermaid = (await import('mermaid')).default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis',
            },
            themeVariables: {
              primaryColor: '#e5e5e5',
              primaryTextColor: '#171717',
              primaryBorderColor: '#a3a3a3',
              lineColor: '#525252',
              secondaryColor: '#f5f5f5',
              tertiaryColor: '#fafafa',
            },
          });
          mermaidInitialized = true;
        }

        const { svg: renderedSvg } = await mermaid.render(idRef.current, chart);
        setSvg(renderedSvg);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart]);

  if (isLoading) {
    return (
      <div className="my-4 p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
        <div className="flex items-center gap-3 text-neutral-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if this is an xychart error (AI used wrong syntax)
    const isXYChartError = chart?.includes('x-axis') || chart?.includes('y-axis') || chart?.includes('xychart');

    return (
      <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {isXYChartError ? 'Graph format not supported' : 'Diagram error'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {isXYChartError
                ? 'Newton tried to create a graph using an unsupported format. Please ask Newton to "draw the graph using chart format" instead.'
                : error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-white border border-neutral-200 rounded-xl overflow-x-auto">
      <div
        className="mermaid-diagram flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

// Memoize to prevent re-renders when parent re-renders
export default memo(MermaidDiagram, (prevProps, nextProps) => {
  return prevProps.chart === nextProps.chart;
});
