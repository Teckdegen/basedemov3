
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TokenHolding {
  contractAddress: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number;
  lastPrice: number;
}

interface PortfolioDataPoint {
  timestamp: string;
  totalValue: number;
}

interface PnLChartProps {
  portfolio: TokenHolding[];
  portfolioHistory: PortfolioDataPoint[];
  usdcBalance: number;
}

export const PnLChart = ({ portfolio, portfolioHistory, usdcBalance }: PnLChartProps) => {
  // Enhanced color palette
  const colorPalette = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6366F1', '#14B8A6', '#F472B6'
  ];

  // Portfolio allocation pie chart
  const allocationData = {
    labels: [...portfolio.map(token => token.symbol), 'USDC'],
    datasets: [
      {
        data: [
          ...portfolio.map(token => token.amount * token.lastPrice),
          usdcBalance
        ],
        backgroundColor: colorPalette,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverBackgroundColor: colorPalette.map(color => `${color}CC`),
      }
    ]
  };

  // P&L bar chart
  const pnlData = {
    labels: portfolio.map(token => token.symbol),
    datasets: [
      {
        label: 'P&L (USDC)',
        data: portfolio.map(token => (token.lastPrice - token.buyPrice) * token.amount),
        backgroundColor: portfolio.map(token => {
          const pnl = (token.lastPrice - token.buyPrice) * token.amount;
          return pnl >= 0 ? '#10B981' : '#EF4444';
        }),
        borderColor: portfolio.map(token => {
          const pnl = (token.lastPrice - token.buyPrice) * token.amount;
          return pnl >= 0 ? '#059669' : '#DC2626';
        }),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  // Historical value line chart
  const isPositive = portfolioHistory.length > 1 ? 
    portfolioHistory[portfolioHistory.length - 1].totalValue >= portfolioHistory[0].totalValue : true;

  const historyData = {
    labels: portfolioHistory.map(point => 
      new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    ),
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioHistory.map(point => point.totalValue),
        borderColor: isPositive ? '#10B981' : '#EF4444',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const color = isPositive ? '#10B981' : '#EF4444';
          gradient.addColorStop(0, `${color}40`);
          gradient.addColorStop(0.5, `${color}20`);
          gradient.addColorStop(1, `${color}00`);
          
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isPositive ? '#10B981' : '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 8,
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `💰 $${value.toFixed(2)} USDC (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutCubic' as const
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const emoji = value >= 0 ? '📈' : '📉';
            return `${emoji} ${value >= 0 ? '+' : ''}$${value.toFixed(2)} USDC`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value: any) {
            return `$${value.toFixed(0)}`;
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic' as const,
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: isPositive ? '#10B981' : '#EF4444',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `💰 $${context.parsed.y.toFixed(2)} USDC`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic' as const,
    }
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Allocation */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-2xl mr-2">🥧</span>
          Portfolio Allocation
        </h3>
        <div className="h-80">
          <Pie data={allocationData} options={pieChartOptions} />
        </div>
      </div>

      {/* P&L by Token */}
      {portfolio.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-2xl mr-2">📊</span>
            P&L by Token
          </h3>
          <div className="h-80">
            <Bar data={pnlData} options={barChartOptions} />
          </div>
        </div>
      )}

      {/* Historical Portfolio Value */}
      {portfolioHistory.length > 1 && (
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-2xl mr-2">📈</span>
            Portfolio Value History
          </h3>
          <div className="h-80">
            <Line data={historyData} options={lineChartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};
