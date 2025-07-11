
import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
}

interface TokenSearchProps {
  onTokenSelect: (contractAddress: string) => void;
}

const searchTokens = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    // If query looks like a contract address, search for that specific address
    if (query.startsWith('0x') && query.length === 42) {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${query}`);
      const data = await response.json();
      
      if (data.pairs) {
        // Filter for Base chain tokens and ensure the base token matches the searched address
        return data.pairs
          .filter((pair: SearchResult) => 
            pair.chainId === 'base' && 
            pair.baseToken.address.toLowerCase() === query.toLowerCase()
          )
          .slice(0, 5);
      }
      return [];
    } else {
      // Search by symbol/name
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.pairs) {
        // Filter for Base chain tokens and prioritize exact matches
        const basePairs = data.pairs.filter((pair: SearchResult) => pair.chainId === 'base');
        
        // Sort by relevance: exact symbol matches first, then name matches, then partial matches
        const sortedPairs = basePairs.sort((a: SearchResult, b: SearchResult) => {
          const queryLower = query.toLowerCase();
          const aSymbol = a.baseToken.symbol.toLowerCase();
          const bSymbol = b.baseToken.symbol.toLowerCase();
          const aName = a.baseToken.name.toLowerCase();
          const bName = b.baseToken.name.toLowerCase();
          
          // Exact symbol match gets highest priority
          if (aSymbol === queryLower && bSymbol !== queryLower) return -1;
          if (bSymbol === queryLower && aSymbol !== queryLower) return 1;
          
          // Symbol starts with query
          if (aSymbol.startsWith(queryLower) && !bSymbol.startsWith(queryLower)) return -1;
          if (bSymbol.startsWith(queryLower) && !aSymbol.startsWith(queryLower)) return 1;
          
          // Name starts with query
          if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
          if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
          
          // Sort by liquidity (higher liquidity first)
          return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
        });
        
        return sortedPairs.slice(0, 10);
      }
      return [];
    }
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
};

export const TokenSearch = ({ onTokenSelect }: TokenSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['tokenSearch', searchQuery],
    queryFn: () => searchTokens(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length >= 2);
  }, []);

  const handleTokenSelect = (tokenAddress: string) => {
    setIsOpen(false);
    setSearchQuery('');
    onTokenSelect(tokenAddress);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search tokens by name, symbol, or contract address..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 pr-4 h-12 bg-white/80 backdrop-blur-md border border-white/20 rounded-lg"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl max-h-96 overflow-y-auto">
              <CardContent className="p-2">
                {searchResults.map((result) => (
                  <Button
                    key={result.pairAddress}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-blue-50"
                    onClick={() => handleTokenSelect(result.baseToken.address)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {result.baseToken.symbol.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">
                          {result.baseToken.symbol}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {result.baseToken.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {result.baseToken.address}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
                          ${parseFloat(result.priceUsd).toFixed(8)}
                        </div>
                        <div className={`text-sm ${result.priceChange?.h24 >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {result.priceChange?.h24 ? `${result.priceChange.h24 >= 0 ? '+' : ''}${result.priceChange.h24.toFixed(2)}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${result.liquidity?.usd ? (result.liquidity.usd / 1000).toFixed(1) + 'K' : 'N/A'} Liq
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
