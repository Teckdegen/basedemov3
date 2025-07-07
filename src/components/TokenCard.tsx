
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TokenHolding {
  contractAddress: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number;
  lastPrice: number;
  logoUrl?: string;
}

interface TokenCardProps {
  token: TokenHolding;
  onClick: () => void;
}

export const TokenCard = ({ token, onClick }: TokenCardProps) => {
  const currentValue = token.amount * token.lastPrice;
  const pnl = (token.lastPrice - token.buyPrice) * token.amount;
  const pnlPercentage = ((token.lastPrice - token.buyPrice) / token.buyPrice) * 100;
  const isPositive = pnl >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="backdrop-blur-md bg-white/90 border border-white/20 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {token.symbol.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{token.symbol}</h3>
                <p className="text-sm text-gray-600">{token.name}</p>
              </div>
            </div>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="font-medium">{token.amount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Buy Price:</span>
              <span className="font-medium">${token.buyPrice.toFixed(8)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Price:</span>
              <span className="font-medium">${token.lastPrice.toFixed(8)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Value:</span>
              <span className="font-semibold">${currentValue.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm text-gray-600">P&L:</span>
              <div className="text-right">
                <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}${pnl.toFixed(2)}
                </div>
                <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
