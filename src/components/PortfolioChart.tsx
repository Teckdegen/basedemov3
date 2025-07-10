
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PortfolioDataPoint {
  timestamp: string;
  totalValue: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
}

export const PortfolioChart = ({ data }: PortfolioChartProps) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate if portfolio is trending up or down
  const isPositive = data.length > 1 ? data[data.length - 1].totalValue >= data[0].totalValue : true;
  const primaryColor = isPositive ? '#10B981' : '#EF4444';

  const chartData = {
    labels: data.map(point => formatTime(point.timestamp)),
    datasets: [
      {
        label: 'Portfolio Value',
        data: data.map(point => point.totalValue),
        borderColor: primaryColor,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${primaryColor}40`);
          gradient.addColorStop(0.5, `${primaryColor}20`);
          gradient.addColorStop(1, `${primaryColor}00`);
          
          return gradient;
        },
        borderWidth: 4,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: primaryColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '📈 Portfolio Performance',
        color: '#1F2937',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        padding: {
          bottom: 25
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: primaryColor,
        borderWidth: 2,
        cornerRadius: 16,
        displayColors: false,
        titleFont: {
          size: 15,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: 16,
        callbacks: {
          title: function(context: any) {
            return `⏰ ${context[0].label}`;
          },
          label: function(context: any) {
            return `💰 $${context.parsed.y.toFixed(2)} USDC`;
          },
          afterLabel: function(context: any) {
            if (data.length > 1) {
              const change = context.parsed.y - data[0].totalValue;
              const changePercent = (change / data[0].totalValue) * 100;
              const emoji = change >= 0 ? '📈' : '📉';
              return `${emoji} ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.15)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          maxTicksLimit: 6,
          padding: 10,
        },
        title: {
          display: true,
          text: '⏰ Time',
          color: '#6B7280',
          font: {
            size: 13,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 15
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 15,
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          }
        },
        title: {
          display: true,
          text: '💲 Value (USDC)',
          color: '#6B7280',
          font: {
            size: 13,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 15
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
      animationDuration: 300,
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
        borderCapStyle: 'round' as const,
      },
      point: {
        hoverRadius: 12,
        hitRadius: 20,
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic',
      delay: (context: any) => context.dataIndex * 100,
    },
  };

  return (
    <div className="w-full h-80 md:h-96 p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};
