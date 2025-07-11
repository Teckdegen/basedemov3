
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WatchlistPanelProps {
  watchlist: string[];
  onRemove: (contractAddress: string) => void;
  onTrade: (contractAddress: string) => void;
}

interface WatchlistToken {
  contractAddress: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export const WatchlistPanel = ({ watchlist, onRemove, onTrade }: WatchlistPanelProps) => {
  const [tokens, setTokens] = useState<WatchlistToken[]>([]);

  // Simulate fetching watchlist token data
  useEffect(() => {
    console.log('Watchlist updated:', watchlist);
    
    const mockTokens = watchlist.map((address, index) => {
      // Create more consistent mock data based on address
      const addressSeed = parseInt(address.slice(-4), 16) || index;
      const symbols = ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF', 'FLOKI', 'MEME', 'WOJAK'];
      const names = ['Pepe Token', 'Dogecoin', 'Shiba Inu', 'Bonk Token', 'Dogwifhat', 'Floki', 'Meme Token', 'Wojak Token'];
      
      const symbolIndex = addressSeed % symbols.length;
      
      return {
        contractAddress: address,
        symbol: symbols[symbolIndex],
        name: names[symbolIndex],
        price: (addressSeed % 100) / 1000000 + 0.000001, // Generate consistent price based on address
        change24h: ((addressSeed % 50) - 25) / 2 // Generate change between -12.5% and +12.5%
      };
    });
    
    setTokens(mockTokens);
    console.log('Mock tokens generated:', mockTokens);
  }, [watchlist]);

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Your watchlist is empty</p>
        <p className="text-sm text-gray-400">
          Add tokens to your watchlist from the trading pages
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token, index) => (
        <motion.div
          key={token.contractAddress}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/50 border border-gray-200 hover:bg-white/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{token.symbol}</h4>
                    <p className="text-sm text-gray-600">${token.price.toFixed(6)}</p>
                    <p className="text-xs text-gray-400 truncate max-w-32">
                      {token.contractAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`text-right ${token.change24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className={`w-4 h-4 ${token.change24h < 0 ? 'rotate-180' : ''}`} />
                      <span className="font-medium">
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        console.log('Trading token:', token.contractAddress);
                        onTrade(token.contractAddress);
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                    >
                      Trade
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('Removing from watchlist:', token.contractAddress);
                        onRemove(token.contractAddress);
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
