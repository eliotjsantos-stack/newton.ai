'use client';

import { useEffect, useState, useRef, memo } from 'react';

function TopicBarChart({ topics, maxItems = 10, title = "Most Discussed Topics" }) {
  const [ChartComponent, setChartComponent] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        const [
          { Chart: ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend },
          { Bar }
        ] = await Promise.all([
          import('chart.js'),
          import('react-chartjs-2')
        ]);

        ChartJS.register(
          CategoryScale,
          LinearScale,
          BarElement,
          Title,
          Tooltip,
          Legend
        );

        setChartComponent({ Bar });
        setIsReady(true);
      } catch (err) {
        console.error('Failed to load Chart.js:', err);
      }
    };

    loadChart();
  }, []);

  if (!isReady || !ChartComponent) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-xl text-center">
        <p className="text-gray-500 text-sm">No topic data available yet.</p>
      </div>
    );
  }

  // Take top N topics
  const displayTopics = topics.slice(0, maxItems);

  const data = {
    labels: displayTopics.map(t => t.topic),
    datasets: [
      {
        label: 'Messages',
        data: displayTopics.map(t => t.totalMessages),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(139, 92, 246, 0.8)',   // Purple
          'rgba(245, 158, 11, 0.8)',   // Amber
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(20, 184, 166, 0.8)',   // Teal
          'rgba(249, 115, 22, 0.8)',   // Orange
          'rgba(99, 102, 241, 0.8)',   // Indigo
          'rgba(34, 197, 94, 0.8)',    // Emerald
        ],
        borderRadius: 6,
        barThickness: 24,
      },
      {
        label: 'Students',
        data: displayTopics.map(t => t.studentCount),
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderRadius: 6,
        barThickness: 24,
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'system-ui, sans-serif', size: 12 },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: { family: 'system-ui, sans-serif', size: 14, weight: 'bold' },
        padding: { bottom: 20 },
        color: '#1f2937',
      },
      tooltip: {
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { family: 'system-ui, sans-serif', size: 11 },
          color: '#6b7280',
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { family: 'system-ui, sans-serif', size: 12 },
          color: '#374151',
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return label.length > 25 ? label.substring(0, 25) + '...' : label;
          }
        },
      },
    },
  };

  const { Bar } = ChartComponent;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div style={{ height: Math.max(300, displayTopics.length * 50) }}>
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

export default memo(TopicBarChart);
