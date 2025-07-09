import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Bell, Heart, Brain, TrendingUp, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { TokenChart } from '@/components/TokenChart';
import { TokenSearch } from '@/components/TokenSearch';
import { useQuery } from '@tanstack/react-query';

interface DexToken {
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
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

const fetchTokenData = async (contractAddress: string): Promise<DexToken | null> => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Find the pair with highest liquidity on Base chain
      const basePairs = data.pairs.filter((pair: any) => pair.chainId === 'base');
      if (basePairs.length > 0) {
        return basePairs.reduce((prev: any, current: any) => 
          (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
        );
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

const Trade = () => {
  const { contractAddress } = useParams();
  const navigate = useNavigate();
  const { profile, updateProfile } = useWallet();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [slippage, setSlippage] = useState(0.3);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: tokenData,
    isLoading: isTokenLoading,
    error: tokenError,
    refetch: refetchToken
  } = useQuery({
    queryKey: ['token', contractAddress],
    queryFn: () => fetchTokenData(contractAddress!),
    enabled: !!contractAddress,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const fee = 0.001; // 0.001 ETH fee
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

  // Calculate estimated amounts
  useEffect(() => {
    if (!tokenData) return;

    if (activeTab === 'buy' && ethAmount) {
      const amount = parseFloat(ethAmount);
      if (!isNaN(amount) && tokenData.priceNative) {
        const tokens = amount / parseFloat(tokenData.priceNative);
        const tokensAfterSlippage = tokens * (1 - slippage / 100);
        setTokenAmount(tokensAfterSlippage.toFixed(6));
      }
    }
  }, [ethAmount, tokenData, slippage, activeTab]);

  const handleBuy = async () => {
    if (!profile || !ethAmount || !tokenData) return;

    const amount = parseFloat(ethAmount);
    const total = amount + fee;

    if (total > profile.fakeUSDCBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough ETH in your wallet",
        variant: "destructive"
      });
      return;
    }

    if (amount < 0.001) {
      toast({
        title: "Invalid Amount",
        description: "Minimum buy amount is 0.001 ETH",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tokens = amount / parseFloat(tokenData.priceNative);
      const tokensAfterSlippage = tokens * (1 - slippage / 100);
      const currentPrice = parseFloat(tokenData.priceUsd);

      // Update portfolio
      const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
      let updatedPortfolio;

      if (existingToken) {
        // Update existing token
        const totalAmount = existingToken.amount + tokensAfterSlippage;
        const newBuyPrice = ((existingToken.amount * existingToken.buyPrice) + (tokensAfterSlippage * currentPrice)) / totalAmount;
        
        updatedPortfolio = profile.portfolio.map(t => 
          t.contractAddress === contractAddress
            ? { ...t, amount: totalAmount, buyPrice: newBuyPrice, lastPrice: currentPrice }
            : t
        );
      } else {
        // Add new token
        updatedPortfolio = [...profile.portfolio, {
          contractAddress: contractAddress!,
          symbol: tokenData.baseToken.symbol,
          name: tokenData.baseToken.name,
          amount: tokensAfterSlippage,
          buyPrice: currentPrice,
          lastPrice: currentPrice,
          logoUrl: ''
        }];
      }

      // Update trade history
      const newTrade = {
        type: 'BUY' as const,
        token: tokenData.baseToken.symbol,
        amount: tokensAfterSlippage,
        price: currentPrice,
        usdcValue: amount,
        slippage,
        fee,
        timestamp: new Date().toISOString()
      };

      // Update portfolio value history
      const newTotalValue = (profile.fakeUSDCBalance - total) + 
        updatedPortfolio.reduce((sum, t) => sum + (t.amount * t.lastPrice), 0);

      updateProfile({
        fakeUSDCBalance: profile.fakeUSDCBalance - total,
        portfolio: updatedPortfolio,
        tradeHistory: [...profile.tradeHistory, newTrade],
        portfolioValueHistory: [
          ...profile.portfolioValueHistory,
          { timestamp: new Date().toISOString(), totalValue: newTotalValue }
        ]
      });

      toast({
        title: "Trade Successful",
        description: `Bought ${tokensAfterSlippage.toLocaleString()} ${tokenData.baseToken.symbol}`,
      });

      // Clear form
      setEthAmount('');
      setTokenAmount('');

    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!profile || !tokenAmount || !tokenData) return;

    const amount = parseFloat(tokenAmount);
    const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);

    if (!existingToken || amount > existingToken.amount) {
      toast({
        title: "Insufficient Tokens",
        description: `Not enough ${tokenData.baseToken.symbol} in your portfolio`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ethReturn = amount * parseFloat(tokenData.priceNative);
      const ethAfterSlippage = ethReturn * (1 - slippage / 100);
      const finalAmount = ethAfterSlippage - fee;
      const currentPrice = parseFloat(tokenData.priceUsd);

      const profit = (currentPrice - existingToken.buyPrice) * amount;

      // Update portfolio
      let updatedPortfolio;
      if (existingToken.amount === amount) {
        // Remove token completely
        updatedPortfolio = profile.portfolio.filter(t => t.contractAddress !== contractAddress);
      } else {
        // Reduce amount
        updatedPortfolio = profile.portfolio.map(t => 
          t.contractAddress === contractAddress
            ? { ...t, amount: t.amount - amount, lastPrice: currentPrice }
            : t
        );
      }

      // Update trade history
      const newTrade = {
        type: 'SELL' as const,
        token: tokenData.baseToken.symbol,
        amount,
        price: currentPrice,
        usdcValue: finalAmount,
        slippage,
        fee,
        profitLoss: profit,
        timestamp: new Date().toISOString()
      };

      // Update portfolio value history
      const newTotalValue = (profile.fakeUSDCBalance + finalAmount) + 
        updatedPortfolio.reduce((sum, t) => sum + (t.amount * t.lastPrice), 0);

      updateProfile({
        fakeUSDCBalance: profile.fakeUSDCBalance + finalAmount,
        portfolio: updatedPortfolio,
        tradeHistory: [...profile.tradeHistory, newTrade],
        portfolioValueHistory: [
          ...profile.portfolioValueHistory,
          { timestamp: new Date().toISOString(), totalValue: newTotalValue }
        ]
      });

      toast({
        title: "Trade Successful",
        description: `Sold ${amount.toLocaleString()} ${tokenData.baseToken.symbol} for ${finalAmount.toFixed(4)} ETH`,
      });

      setEthAmount('');
      setTokenAmount('');

    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = () => {
    if (!profile || !contractAddress || !tokenData) return;

    if (profile.watchlist.includes(contractAddress)) {
      toast({
        title: "Already in Watchlist",
        description: `${tokenData.baseToken.symbol} is already in your watchlist`,
      });
      return;
    }

    updateProfile({
      watchlist: [...profile.watchlist, contractAddress]
    });

    toast({
      title: "Added to Watchlist",
      description: `${tokenData.baseToken.symbol} added to your watchlist`,
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6 flex items-center justify-center">
        <p>Please connect your wallet to continue</p>
      </div>
    );
  }

  // If no contract address, show search interface
  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-3xl font-bold text-gray-800">Search Base Tokens</h1>
            <p className="text-gray-600">Find and trade tokens on the Base network</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <TokenSearch onTokenSelect={(address) => navigate(`/trade/${address}`)} />
          </motion.div>
        </div>
      </div>
    );
  }

  if (isTokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load token data</p>
          <Button onClick={() => refetchToken()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
  const isPositive = tokenData.priceChange.h24 >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header with Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Button
            onClick={() => navigate('/trade')}
            variant="ghost"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Search Tokens</span>
          </Button>

          <div className="flex-1 max-w-md mx-4">
            <TokenSearch onTokenSelect={(address) => navigate(`/trade/${address}`)} />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={addToWatchlist}
              variant="outline"
              size="sm"
              className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
              onClick={() => window.open(tokenData.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Token Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {tokenData.baseToken.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      {tokenData.baseToken.symbol}
                    </CardTitle>
                    <p className="text-gray-600">{tokenData.baseToken.name}</p>
                    <p className="text-xs text-gray-500">
                      {tokenData.baseToken.address.slice(0, 6)}...{tokenData.baseToken.address.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ${parseFloat(tokenData.priceUsd).toFixed(8)}
                  </p>
                  <p className="text-sm text-gray-500">{currentTime}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">24h Change</p>
                  <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{tokenData.priceChange.h24.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Market Cap</p>
                  <p className="font-semibold">
                    {tokenData.marketCap ? `$${(tokenData.marketCap / 1e6).toFixed(2)}M` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Liquidity</p>
                  <p className="font-semibold">
                    ${tokenData.liquidity?.usd ? (tokenData.liquidity.usd / 1e3).toFixed(1) + 'K' : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">24h Volume</p>
                  <p className="font-semibold">
                    ${tokenData.volume?.h24 ? (tokenData.volume.h24 / 1e3).toFixed(1) + 'K' : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    24h Price Chart
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchToken()}
                    className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TokenChart 
                  price={parseFloat(tokenData.priceUsd)} 
                  symbol={tokenData.baseToken.symbol} 
                  priceChange24h={tokenData.priceChange.h24}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Trading Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab('buy')}
                    variant={activeTab === 'buy' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'buy' ? 'bg-blue-600 text-white' : ''}`}
                  >
                    Buy
                  </Button>
                  <Button
                    onClick={() => setActiveTab('sell')}
                    variant={activeTab === 'sell' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'sell' ? 'bg-red-500 text-white' : ''}`}
                  >
                    Sell
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTab === 'buy' ? (
                  <>
                    <div>
                      <Label htmlFor="eth-amount">ETH Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="eth-amount"
                          type="number"
                          placeholder="0.00"
                          value={ethAmount}
                          onChange={(e) => setEthAmount(e.target.value)}
                          className="flex-1"
                          step="0.001"
                        />
                        <Button
                          onClick={() => setEthAmount((profile.fakeUSDCBalance - fee).toFixed(3))}
                          variant="outline"
                          className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {profile.fakeUSDCBalance.toFixed(3)} ETH
                      </p>
                    </div>

                    <div>
                      <Label>Estimated {tokenData.baseToken.symbol}</Label>
                      <Input
                        value={tokenAmount}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                      <Input
                        id="slippage"
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0.1"
                        max="5"
                      />
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span>{fee} ETH</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{(parseFloat(ethAmount || '0') + fee).toFixed(3)} ETH</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleBuy}
                      disabled={!ethAmount || isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]"
                    >
                      {isLoading ? 'Processing...' : `Buy ${tokenData.baseToken.symbol}`}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="token-amount">{tokenData.baseToken.symbol} Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="token-amount"
                          type="number"
                          placeholder="0"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(e.target.value)}
                          className="flex-1"
                          step="0.000001"
                        />
                        <Button
                          onClick={() => existingToken && setTokenAmount(existingToken.amount.toString())}
                          variant="outline"
                          disabled={!existingToken}
                          className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {existingToken ? existingToken.amount.toLocaleString() : '0'} {tokenData.baseToken.symbol}
                      </p>
                    </div>

                    <div>
                      <Label>Estimated ETH</Label>
                      <Input
                        value={tokenAmount ? ((parseFloat(tokenAmount) * parseFloat(tokenData.priceNative) * (1 - slippage / 100)) - fee).toFixed(4) : ''}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slippage-sell">Slippage Tolerance (%)</Label>
                      <Input
                        id="slippage-sell"
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0.1"
                        max="5"
                      />
                    </div>

                    {existingToken && tokenAmount && (
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Buy Price:</span>
                          <span>${existingToken.buyPrice.toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Price:</span>
                          <span>${parseFloat(tokenData.priceUsd).toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee:</span>
                          <span>{fee} ETH</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Profit/Loss:</span>
                          <span className={`${(parseFloat(tokenData.priceUsd) - existingToken.buyPrice) * parseFloat(tokenAmount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ${((parseFloat(tokenData.priceUsd) - existingToken.buyPrice) * parseFloat(tokenAmount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSell}
                      disabled={!tokenAmount || !existingToken || isLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white min-h-[48px]"
                    >
                      {isLoading ? 'Processing...' : `Sell ${tokenData.baseToken.symbol}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Token Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Trading Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">24h Buys</p>
                  <p className="font-semibold text-green-600">
                    {tokenData.txns.h24.buys}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">24h Sells</p>
                  <p className="font-semibold text-red-500">
                    {tokenData.txns.h24.sells}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">FDV</p>
                  <p className="font-semibold">
                    {tokenData.fdv ? `$${(tokenData.fdv / 1e6).toFixed(2)}M` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pair Age</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() / 1000 - tokenData.pairCreatedAt) / 86400)}d
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Trade;
