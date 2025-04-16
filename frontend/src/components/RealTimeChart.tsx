import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Ensure a date adapter is imported if not already
import StreamingPlugin from 'chartjs-plugin-streaming';

// Register the streaming plugin (ensure this is done once, e.g., in a setup file)
Chart.register(StreamingPlugin);

interface RealTimeChartProps {
  selectedAxis: string;
  selectedMachine: {
    featureHistory?: Array<{
      [key: string]: {
        rms: number;
        kurtosis: number;
        pp: number;
        crestf: number;
      };
    }>;
  };
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({ selectedAxis, selectedMachine }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy the previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'RMS',
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Kurtosis',
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false,
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'PP',
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Crest Factor',
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: false,
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'realtime',
            realtime: {
              onRefresh: (chart) => {
                if ((selectedMachine?.featureHistory ?? []).length > 0) {
                  const latest = (selectedMachine.featureHistory ?? [])[selectedMachine.featureHistory?.length ? selectedMachine.featureHistory.length - 1 : 0];
                  const axisData = latest[selectedAxis];
                  if (axisData) {
                    const now = Date.now();
                    console.log('Chart adding data:', {
                      now,
                      rms: axisData.rms,
                      kurtosis: axisData.kurtosis,
                      pp: axisData.pp,
                      crestf: axisData.crestf,
                    });
                    chart.data.datasets[0].data.push({ x: now, y: axisData.rms });
                    chart.data.datasets[1].data.push({ x: now, y: axisData.kurtosis });
                    chart.data.datasets[2].data.push({ x: now, y: axisData.pp });
                    chart.data.datasets[3].data.push({ x: now, y: axisData.crestf });
                    // Remove old data points to match duration
                    const removeTime = now - 20000;
                    chart.data.datasets.forEach((dataset) => {
                      dataset.data = dataset.data.filter((point) => point && typeof point === 'object' && 'x' in point && point.x > removeTime);
                    });
                    chart.update();
                  }
                }
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${selectedAxis.toUpperCase()} Axis Measurements`,
          },
          streaming: {
            duration: 20000, // 20 seconds of data
            refresh: 1000,   // Refresh every 1 second
            delay: 0,
            frameRate: 30,
          },
        },
        animation: false,
      },
    });

    // Cleanup function to destroy the chart on unmount or re-render
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [selectedAxis, selectedMachine]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default RealTimeChart;