
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export const Ticker = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>([
    { symbol: 'PEPE', price: '$0.000015', change: '+2.3%', isPositive: true },
    { symbol: 'DOGE', price: '$0.082', change: '-1.2%', isPositive: false },
    { symbol: 'SHIB', price: '$0.0000089', change: '+5.7%', isPositive: true },
    { symbol: 'BONK', price: '$0.000012', change: '+0.8%', isPositive: true },
    { symbol: 'WIF', price: '$2.34', change: '-3.1%', isPositive: false },
  ]);

  const [isPaused, setIsPaused] = useState(false);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setTickerData(prev => prev.map(item => ({
          ...item,
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(1)}%`,
          isPositive: Math.random() > 0.5
        })));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/15 border-b border-white/20 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex whitespace-nowrap py-2"
        animate={isPaused ? {} : { x: [0, -1000] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="flex items-center space-x-2 mx-4 px-4 py-1 rounded-lg bg-white/10"
          >
            <span className="font-semibold text-gray-800">{item.symbol}</span>
            <span className="text-sm text-gray-600">{item.price}</span>
            <span
              className={`text-sm font-medium ${
                item.isPositive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
