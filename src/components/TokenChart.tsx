
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

interface TokenChartProps {
  price: number;
  symbol: string;
}

export const TokenChart = ({ price, symbol }: TokenChartProps) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Generate mock 24h price data
  const generatePriceData = () => {
    const points = 48; // 30-minute intervals for 24h
    const data = [];
    const now = new Date();
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 30 * 60 * 1000));
      const variance = (Math.random() - 0.5) * 0.1; // ±10% variance
      const dataPrice = price * (1 + variance);
      
      data.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: dataPrice
      });
    }
    
    return data;
  };

  const priceData = generatePriceData();
  const isPositive = priceData[priceData.length - 1].price > priceData[0].price;

  const chartData = {
    labels: priceData.map(point => point.time),
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceData.map(point => point.price),
        borderColor: isPositive ? '#10B981' : '#EF4444',
        backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isPositive ? '#10B981' : '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
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
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: 'rgba(30, 64, 175, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(8)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          maxTicksLimit: 6
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return `$${parseFloat(value).toFixed(8)}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="w-full h-64 md:h-80">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};
