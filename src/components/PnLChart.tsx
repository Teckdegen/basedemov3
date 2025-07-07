
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
  // Portfolio allocation pie chart
  const allocationData = {
    labels: [...portfolio.map(token => token.symbol), 'USDC'],
    datasets: [
      {
        data: [
          ...portfolio.map(token => token.amount * token.lastPrice),
          usdcBalance
        ],
        backgroundColor: [
          '#1E40AF', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      }
    ]
  };

  // P&L bar chart
  const pnlData = {
    labels: portfolio.map(token => token.symbol),
    datasets: [
      {
        label: 'P&L (USD)',
        data: portfolio.map(token => (token.lastPrice - token.buyPrice) * token.amount),
        backgroundColor: portfolio.map(token => 
          (token.lastPrice - token.buyPrice) * token.amount >= 0 ? '#10B981' : '#EF4444'
        ),
        borderColor: portfolio.map(token => 
          (token.lastPrice - token.buyPrice) * token.amount >= 0 ? '#059669' : '#DC2626'
        ),
        borderWidth: 1,
      }
    ]
  };

  // Historical value line chart
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
        borderColor: '#1E40AF',
        backgroundColor: 'rgba(30, 64, 175, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: 'rgba(30, 64, 175, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Allocation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Allocation</h3>
        <div className="h-64">
          <Pie data={allocationData} options={chartOptions} />
        </div>
      </div>

      {/* P&L by Token */}
      {portfolio.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">P&L by Token</h3>
          <div className="h-64">
            <Bar data={pnlData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Historical Portfolio Value */}
      {portfolioHistory.length > 1 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Value History</h3>
          <div className="h-64">
            <Line data={historyData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};
