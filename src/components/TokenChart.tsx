
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
      
      // Create a realistic price progression with more sophisticated volatility
      const progress = (points - i) / points;
      const trendPrice = startPrice + (price - startPrice) * progress;
      
      // Add wave-like volatility for more realistic price movement
      const waveVolatility = Math.sin(progress * Math.PI * 4) * 0.02;
      const randomVolatility = (Math.random() - 0.5) * 0.05;
      const dataPrice = trendPrice * (1 + waveVolatility + randomVolatility);
      
      data.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: Math.max(dataPrice, 0.00000001)
      });
    }
    
    // Ensure the last price matches the current price
    data[data.length - 1].price = price;
    
    return data;
  };

  const priceData = generatePriceData();
  const isPositive = priceChange24h >= 0;
  const primaryColor = isPositive ? '#10B981' : '#EF4444';
  const secondaryColor = isPositive ? '#059669' : '#DC2626';

  const chartData = {
    labels: priceData.map((point, index) => {
      if (index % 8 === 0 || index === priceData.length - 1) {
        return point.time;
      }
      return '';
    }),
    datasets: [
      {
        label: `${symbol} Price (USD)`,
        data: priceData.map(point => point.price),
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
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: primaryColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
        segment: {
          borderColor: (ctx: any) => {
            const current = ctx.p1.parsed.y;
            const previous = ctx.p0.parsed.y;
            return current >= previous ? '#10B981' : '#EF4444';
          }
        }
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
        text: `${symbol} - 24H Price Movement`,
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
            return `📊 ${context[0].label}`;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            return `💰 $${value.toFixed(value < 0.01 ? 8 : 4)}`;
          },
          afterLabel: function(context: any) {
            const currentPrice = context.parsed.y;
            const startPrice = priceData[0].price;
            const change = ((currentPrice - startPrice) / startPrice) * 100;
            const emoji = change >= 0 ? '📈' : '📉';
            return `${emoji} ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
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
          autoSkip: true,
          padding: 10,
        },
        title: {
          display: true,
          text: '⏰ Time (24H)',
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
        position: 'right',
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
          maxTicksLimit: 8,
          padding: 15,
          callback: function(value: any) {
            const numValue = parseFloat(value);
            if (numValue < 0.01) {
              return `$${numValue.toFixed(8)}`;
            } else if (numValue < 1) {
              return `$${numValue.toFixed(4)}`;
            } else {
              return `$${numValue.toLocaleString()}`;
            }
          }
        },
        title: {
          display: true,
          text: '💲 Price (USD)',
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
        hoverRadius: 10,
        hitRadius: 20,
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic',
    },
  };

  return (
    <div className="w-full h-80 md:h-96 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="relative z-10">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      {/* Price Overlay */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="text-sm text-gray-600">Current Price</div>
        <div className="text-lg font-bold text-gray-800">
          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
        </div>
      </div>
    </div>
  );
};
