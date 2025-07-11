
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

const fetchTokenData = async (address: string): Promise<WatchlistToken | null> => {
  try {
    // First try to get cached token data from localStorage
    const cachedTokens = localStorage.getItem('tokenCache');
    if (cachedTokens) {
      const cache = JSON.parse(cachedTokens);
      const cachedToken = cache[address];
      if (cachedToken) {
        return {
          contractAddress: address,
          symbol: cachedToken.symbol || 'UNKNOWN',
          name: cachedToken.name || 'Unknown Token',
          price: cachedToken.price || 0.000001,
          change24h: cachedToken.change24h || 0
        };
      }
    }

    // Try to fetch from DexScreener API
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Find Base chain pair or use the first one
      const basePair = data.pairs.find((pair: any) => pair.chainId === 'base') || data.pairs[0];
      
      const tokenData = {
        contractAddress: address,
        symbol: basePair.baseToken.symbol,
        name: basePair.baseToken.name,
        price: parseFloat(basePair.priceUsd || '0'),
        change24h: basePair.priceChange?.h24 || 0
      };

      // Cache the token data
      const existingCache = JSON.parse(localStorage.getItem('tokenCache') || '{}');
      existingCache[address] = tokenData;
      localStorage.setItem('tokenCache', JSON.stringify(existingCache));

      return tokenData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

export const WatchlistPanel = ({ watchlist, onRemove, onTrade }: WatchlistPanelProps) => {
  const [tokens, setTokens] = useState<WatchlistToken[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTokenData = async () => {
      if (watchlist.length === 0) {
        setTokens([]);
        return;
      }

      setLoading(true);
      console.log('Loading token data for watchlist:', watchlist);
      
      const tokenPromises = watchlist.map(async (address) => {
        const tokenData = await fetchTokenData(address);
        if (tokenData) {
          return tokenData;
        }
        
        // Fallback to generic data if API fails
        return {
          contractAddress: address,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          price: 0.000001,
          change24h: 0
        };
      });

      try {
        const tokenResults = await Promise.all(tokenPromises);
        setTokens(tokenResults);
        console.log('Loaded token data:', tokenResults);
      } catch (error) {
        console.error('Error loading token data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading watchlist tokens...</p>
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
