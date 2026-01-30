'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';

// Safe math evaluator for formulas
function evaluateFormula(formula, x) {
  try {
    // Replace common math notation
    let expr = formula
      .replace(/\^/g, '**')           // x^2 -> x**2
      .replace(/(\d)x/g, '$1*x')      // 2x -> 2*x
      .replace(/x(\d)/g, 'x*$1')      // x2 -> x*2
      .replace(/\)x/g, ')*x')         // )x -> )*x
      .replace(/x\(/g, 'x*(')         // x( -> x*(
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/log/g, 'Math.log')
      .replace(/pi/gi, 'Math.PI')
      .replace(/e(?![a-z])/gi, 'Math.E');

    // Create function and evaluate
    const fn = new Function('x', `return ${expr}`);
    const result = fn(x);
    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// Generate points for a formula across a range
function generateFormulaPoints(formula, xMin, xMax, numPoints = 300) {
  const points = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = evaluateFormula(formula, x);
    if (y !== null) {
      points.push({ x, y });
    }
  }
  return points;
}

// Convert ^n to superscript characters for display
function formatSuperscripts(text) {
  if (!text) return text;
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'n': 'ⁿ', 'x': 'ˣ', '-': '⁻', '+': '⁺'
  };
  return text.replace(/\^([0-9n\-\+]+)/g, (match, exp) => {
    return exp.split('').map(c => superscripts[c] || c).join('');
  });
}

function ChartDiagram({ config }) {
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [parsedConfig, setParsedConfig] = useState(null);
  const [ChartComponent, setChartComponent] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const lastConfigRef = useRef('');
  const stabilityTimerRef = useRef(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        const [
          { Chart: ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler },
          { Line, Bar, Scatter }
        ] = await Promise.all([
          import('chart.js'),
          import('react-chartjs-2')
        ]);

        ChartJS.register(
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          BarElement,
          Title,
          Tooltip,
          Legend,
          Filler
        );

        setChartComponent({ Line, Bar, Scatter });
        setIsReady(true);
      } catch (err) {
        console.error('Failed to load Chart.js:', err);
        setError('Failed to load chart library');
      }
    };

    loadChart();
  }, []);

  useEffect(() => {
    const configStr = typeof config === 'string' ? config : JSON.stringify(config);

    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
    }

    if (configStr !== lastConfigRef.current) {
      setIsStable(false);
      lastConfigRef.current = configStr;
    }

    stabilityTimerRef.current = setTimeout(() => {
      setIsStable(true);
    }, 300);

    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, [config]);

  useEffect(() => {
    if (!isReady || !isStable) return;

    try {
      const configStr = typeof config === 'string' ? config.trim() : JSON.stringify(config);

      if (!configStr.startsWith('{') || !configStr.endsWith('}')) {
        return;
      }

      const parsed = JSON.parse(configStr);

      if (!parsed.datasets || !Array.isArray(parsed.datasets)) {
        return;
      }

      setParsedConfig(parsed);
      setError(null);
    } catch (err) {
      const configStr = typeof config === 'string' ? config.trim() : '';
      if (configStr.endsWith('}')) {
        setError('Invalid chart configuration');
      }
    }
  }, [config, isReady, isStable]);

  // Calculate view window based on pan
  const viewWindow = useMemo(() => {
    if (!parsedConfig) return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

    const { datasets, xValues } = parsedConfig;

    // Get initial bounds from data
    const numericXValues = (xValues || []).map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
    const allY = (datasets || []).flatMap(ds => ds.data || []);

    let xMin = numericXValues.length ? Math.min(...numericXValues) : -10;
    let xMax = numericXValues.length ? Math.max(...numericXValues) : 10;
    let yMin = allY.length ? Math.min(...allY) : -10;
    let yMax = allY.length ? Math.max(...allY) : 10;

    const xRange = (xMax - xMin) || 20;
    const yRange = (yMax - yMin) || 20;

    // Apply pan (shift the view window)
    const xShift = (panX / 100) * xRange * 2;
    const yShift = (panY / 100) * yRange * 2;

    return {
      xMin: xMin - xRange * 0.1 + xShift,
      xMax: xMax + xRange * 0.1 + xShift,
      yMin: yMin - yRange * 0.1 + yShift,
      yMax: yMax + yRange * 0.1 + yShift,
    };
  }, [parsedConfig, panX, panY]);

  // Generate chart datasets with formula support
  const chartData = useMemo(() => {
    if (!parsedConfig) return null;

    const { type = 'line', datasets, xValues } = parsedConfig;

    // Extend view for generating points (so line doesn't stop at edge)
    const extendedXMin = viewWindow.xMin - (viewWindow.xMax - viewWindow.xMin) * 0.5;
    const extendedXMax = viewWindow.xMax + (viewWindow.xMax - viewWindow.xMin) * 0.5;

    const chartDatasets = (datasets || []).map((ds, index) => {
      let dataPoints;

      // If formula is provided, generate points dynamically
      if (ds.formula) {
        dataPoints = generateFormulaPoints(ds.formula, extendedXMin, extendedXMax, 500);
      } else {
        // Use provided data points
        const numericXValues = (xValues || []).map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
        dataPoints = (ds.data || []).map((y, i) => ({
          x: numericXValues[i] !== undefined ? numericXValues[i] : i,
          y: typeof y === 'number' ? y : parseFloat(y) || 0
        }));
      }

      // Use tension for smoothing when we have fewer points
      const useTension = !ds.formula && dataPoints.length < 50;

      return {
        label: formatSuperscripts(ds.label) || `Series ${index + 1}`,
        data: dataPoints,
        borderColor: ds.color || getColor(index),
        backgroundColor: type === 'bar' ? (ds.color || getColor(index)) : 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: ds.color || getColor(index),
        fill: false,
        tension: useTension ? 0.35 : 0,
        cubicInterpolationMode: useTension ? 'monotone' : 'default',
      };
    });

    return { datasets: chartDatasets };
  }, [parsedConfig, viewWindow]);

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!isReady || !isStable || !parsedConfig || !ChartComponent || !chartData) {
    return (
      <div className="my-4 p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
        <div className="flex items-center gap-3 text-neutral-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Generating chart...</span>
        </div>
      </div>
    );
  }

  const { type = 'line', title, xLabel, yLabel, datasets, xValues } = parsedConfig;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        display: datasets && datasets.length > 1,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { family: 'system-ui, sans-serif', size: 11 },
        },
      },
      title: {
        display: !!title,
        text: formatSuperscripts(title),
        font: { family: 'system-ui, sans-serif', size: 14, weight: 'bold' },
        padding: { bottom: 10 },
        color: '#171717',
      },
      tooltip: {
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            const point = context.parsed;
            return `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: viewWindow.xMin,
        max: viewWindow.xMax,
        title: {
          display: false, // Cleaner without axis labels
        },
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? '#374151' : '#e5e7eb',
          lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1,
        },
        ticks: {
          font: { family: 'system-ui, sans-serif', size: 10 },
          color: '#6b7280',
          callback: (value) => Number.isInteger(value) ? value : '',
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        min: viewWindow.yMin,
        max: viewWindow.yMax,
        title: {
          display: false, // Don't show rotated y label
        },
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? '#374151' : '#e5e7eb',
          lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1,
        },
        ticks: {
          font: { family: 'system-ui, sans-serif', size: 10 },
          color: '#6b7280',
          callback: (value) => Number.isInteger(value) ? value : '',
        },
      },
    },
  };

  // Bar chart config
  if (type === 'bar') {
    options.scales.x = {
      type: 'category',
      labels: xValues,
      grid: { color: '#e5e7eb' },
      ticks: { font: { family: 'system-ui, sans-serif', size: 10 }, color: '#6b7280' },
    };
    options.scales.y = {
      type: 'linear',
      beginAtZero: true,
      grid: { color: '#e5e7eb' },
      ticks: { font: { family: 'system-ui, sans-serif', size: 10 }, color: '#6b7280' },
    };
    chartData.labels = xValues;
    chartData.datasets = (datasets || []).map((ds, index) => ({
      label: ds.label || `Series ${index + 1}`,
      data: ds.data,
      backgroundColor: ds.color || getColor(index),
      borderRadius: 4,
    }));
  }

  const { Line, Bar } = ChartComponent;
  const ActiveChart = type === 'bar' ? Bar : Line;
  const showPanControls = type !== 'bar';

  return (
    <div className="my-4 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex">
        {/* Y slider on the left - vertical */}
        {showPanControls && (
          <div className="flex flex-col items-center justify-center px-2 py-4 bg-neutral-50/50 border-r border-neutral-100">
            <span className="text-xs text-neutral-500 mb-2">Y</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={panY}
              onChange={(e) => setPanY(Number(e.target.value))}
              className="h-48 w-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
            {panY !== 0 && (
              <button
                onClick={() => setPanY(0)}
                className="text-xs text-neutral-400 hover:text-neutral-600 mt-2"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Chart and X slider */}
        <div className="flex-1">
          <div className="p-4">
            <div style={{ height: '280px' }}>
              <ActiveChart ref={chartRef} data={chartData} options={options} />
            </div>
          </div>

          {/* X slider at bottom - horizontal */}
          {showPanControls && (
            <div className="px-4 pb-3 flex items-center gap-3 border-t border-neutral-100 pt-3 bg-neutral-50/50">
              <span className="text-xs text-neutral-500">X</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={panX}
                onChange={(e) => setPanX(Number(e.target.value))}
                className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              {panX !== 0 && (
                <button
                  onClick={() => setPanX(0)}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getColor(index) {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  return colors[index % colors.length];
}

// Memoize to prevent re-renders when parent re-renders (e.g., typing in chat)
export default memo(ChartDiagram, (prevProps, nextProps) => {
  // Only re-render if config actually changed
  const prevConfig = typeof prevProps.config === 'string' ? prevProps.config : JSON.stringify(prevProps.config);
  const nextConfig = typeof nextProps.config === 'string' ? nextProps.config : JSON.stringify(nextProps.config);
  return prevConfig === nextConfig;
});
