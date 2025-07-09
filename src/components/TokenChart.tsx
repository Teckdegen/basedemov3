
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
  Filler,
  ChartOptions
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
  priceChange24h?: number;
}

export const TokenChart = ({ price, symbol, priceChange24h = 0 }: TokenChartProps) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Generate realistic 24h price data based on current price and 24h change
  const generatePriceData = () => {
    const points = 48; // 30-minute intervals for 24h
    const data = [];
    const now = new Date();
    
    // Calculate starting price based on 24h change
    const startPrice = price / (1 + (priceChange24h / 100));
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 30 * 60 * 1000));
      
      // Create a realistic price progression
      const progress = (points - i) / points;
      const trendPrice = startPrice + (price - startPrice) * progress;
      
      // Add some random volatility (±5%)
      const volatility = (Math.random() - 0.5) * 0.1;
      const dataPrice = trendPrice * (1 + volatility);
      
      data.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: Math.max(dataPrice, 0.00000001) // Ensure price doesn't go negative
      });
    }
    
    // Ensure the last price matches the current price
    data[data.length - 1].price = price;
    
    return data;
  };

  const priceData = generatePriceData();
  const isPositive = priceChange24h >= 0;

  const chartData = {
    labels: priceData.map((point, index) => {
      // Show fewer labels on mobile/small charts
      if (index % 6 === 0) {
        return point.time;
      }
      return '';
    }),
    datasets: [
      {
        label: `${symbol} Price (USD)`,
        data: priceData.map(point => point.price),
        borderColor: isPositive ? '#10B981' : '#EF4444',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isPositive ? '#10B981' : '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: isPositive ? '#10B981' : '#EF4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${symbol} - 24H Price Chart`,
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: isPositive ? '#10B981' : '#EF4444',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        callbacks: {
          title: function(context: any) {
            return `Time: ${context[0].label}`;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            return `Price: $${value.toFixed(value < 0.01 ? 8 : 4)}`;
          },
          afterLabel: function(context: any) {
            const currentPrice = context.parsed.y;
            const startPrice = priceData[0].price;
            const change = ((currentPrice - startPrice) / startPrice) * 100;
            return `Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
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
            size: 11
          },
          maxTicksLimit: 8,
          autoSkip: true,
        },
        title: {
          display: true,
          text: 'Time (24H)',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          },
          maxTicksLimit: 6,
          callback: function(value: any) {
            const numValue = parseFloat(value);
            if (numValue < 0.01) {
              return `$${numValue.toFixed(8)}`;
            } else if (numValue < 1) {
              return `$${numValue.toFixed(4)}`;
            } else {
              return `$${numValue.toFixed(2)}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Price (USD)',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
      },
      point: {
        hoverRadius: 8,
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    }
  };

  return (
    <div className="w-full h-64 md:h-80 p-4">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};
