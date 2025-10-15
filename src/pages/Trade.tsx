
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Bell, Heart, TrendingUp, ExternalLink, User, AlertCircle, ArrowLeftRight } from 'lucide-react';
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

  const fee = 1; // 1 USDC fee
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
      if (!isNaN(amount) && tokenData.priceUsd) {
        const tokens = amount / parseFloat(tokenData.priceUsd);
        const tokensAfterSlippage = tokens * (1 - slippage / 100);
        setTokenAmount(tokensAfterSlippage.toFixed(6));
      }
    }
  }, [ethAmount, tokenData, slippage, activeTab]);

  const handleBuy = async () => {
    if (!profile || !ethAmount || !tokenData) return;

    const amount = parseFloat(ethAmount);
    const total = amount + fee;

    console.log('Buy transaction:', { amount, fee, total, balance: profile.fakeUSDCBalance });

    if (total > profile.fakeUSDCBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough USDC in your wallet",
        variant: "destructive"
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum buy amount is 1 USDC",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tokens = amount / parseFloat(tokenData.priceUsd);
      const tokensAfterSlippage = tokens * (1 - slippage / 100);
      const currentPrice = parseFloat(tokenData.priceUsd);

      console.log('Token calculation:', { tokens, tokensAfterSlippage, currentPrice });

      // Update portfolio
      const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
      let updatedPortfolio;

      if (existingToken) {
        // Update existing token - calculate weighted average buy price
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

      // Calculate new balance correctly
      const newBalance = profile.fakeUSDCBalance - total;
      
      console.log('Balance update:', { 
        oldBalance: profile.fakeUSDCBalance, 
        newBalance, 
        spent: total 
      });

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
      const portfolioValue = updatedPortfolio.reduce((sum, t) => sum + (t.amount * t.lastPrice), 0);
      const newTotalValue = newBalance + portfolioValue;

      updateProfile({
        fakeUSDCBalance: newBalance,
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
      console.error('Buy error:', error);
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

      const usdcReturn = amount * parseFloat(tokenData.priceUsd);
      const usdcAfterSlippage = usdcReturn * (1 - slippage / 100);
      const finalAmount = usdcAfterSlippage - fee;
      const currentPrice = parseFloat(tokenData.priceUsd);

      const profit = (currentPrice - existingToken.buyPrice) * amount;

      console.log('Sell transaction:', { 
        amount, 
        usdcReturn, 
        usdcAfterSlippage, 
        finalAmount, 
        currentBalance: profile.fakeUSDCBalance 
      });

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

      // Calculate new balance correctly
      const newBalance = profile.fakeUSDCBalance + finalAmount;

      console.log('Sell balance update:', { 
        oldBalance: profile.fakeUSDCBalance, 
        newBalance, 
        received: finalAmount 
      });

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
      const portfolioValue = updatedPortfolio.reduce((sum, t) => sum + (t.amount * t.lastPrice), 0);
      const newTotalValue = newBalance + portfolioValue;

      updateProfile({
        fakeUSDCBalance: newBalance,
        portfolio: updatedPortfolio,
        tradeHistory: [...profile.tradeHistory, newTrade],
        portfolioValueHistory: [
          ...profile.portfolioValueHistory,
          { timestamp: new Date().toISOString(), totalValue: newTotalValue }
        ]
      });

      toast({
        title: "Trade Successful",
        description: `Sold ${amount.toLocaleString()} ${tokenData.baseToken.symbol} for ${finalAmount.toFixed(2)} USDC`,
      });

      setEthAmount('');
      setTokenAmount('');

    } catch (error) {
      console.error('Sell error:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 pb-20 md:pb-6 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center space-y-4 p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to start trading</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no contract address, show search interface
  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
              <ArrowLeftRight className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Trade Tokens</h1>
            </div>
            <p className="text-gray-600 text-lg">Discover and trade tokens on the Base network</p>
          </motion.div>

          {/* Balance Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white max-w-md mx-auto"
          >
            <div className="text-center">
              <p className="text-blue-100 mb-1">Available Balance</p>
              <p className="text-3xl font-bold">{profile.fakeUSDCBalance.toFixed(2)} USDC</p>
              <p className="text-blue-100 text-sm">${profile.fakeUSDCBalance.toFixed(2)}</p>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-2xl mx-auto rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <TokenSearch onTokenSelect={(address) => navigate(`/trade/${address}`)} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Start</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Search for any Base token</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>View real-time price charts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Buy and sell with low fees</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tokens Owned</span>
                    <span className="font-semibold">{profile.portfolio.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades</span>
                    <span className="font-semibold">{profile.tradeHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Watchlist</span>
                    <span className="font-semibold">{profile.watchlist.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isTokenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-20 md:pb-6 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center space-y-4 p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Loading token data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-20 md:pb-6 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center space-y-4 p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Failed to Load Token</h2>
            <p className="text-gray-600">Unable to fetch token data from DexScreener</p>
            <Button onClick={() => refetchToken()} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
  const isPositive = tokenData.priceChange.h24 >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <Button
            onClick={() => navigate('/trade')}
            variant="ghost"
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setActiveTab('buy')}
              variant={activeTab === 'buy' ? 'default' : 'outline'}
              size="sm"
              className={`${activeTab === 'buy' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 hover:text-green-600'} rounded-xl`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Buy
            </Button>
            <Button
              onClick={() => setActiveTab('sell')}
              variant={activeTab === 'sell' ? 'default' : 'outline'}
              size="sm"
              className={`${activeTab === 'sell' ? 'bg-red-500 hover:bg-red-600 text-white' : 'hover:bg-red-50 hover:text-red-600'} rounded-xl`}
              disabled={!existingToken}
            >
              <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
              Sell
            </Button>
            <Button
              onClick={addToWatchlist}
              variant="outline"
              size="sm"
              className="hover:bg-pink-50 hover:text-pink-600 rounded-xl"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-yellow-50 hover:text-yellow-600 rounded-xl"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
              onClick={() => window.open(tokenData.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-blue-100 mb-1">Your Balance</p>
              <p className="text-3xl font-bold">{profile.fakeUSDCBalance.toFixed(2)} USDC</p>
              <p className="text-blue-100 text-sm">${profile.fakeUSDCBalance.toFixed(2)}</p>
            </div>
            {existingToken && (
              <div className="text-center sm:text-right">
                <p className="text-blue-100 mb-1">Holdings</p>
                <p className="text-xl font-semibold">
                  {existingToken.amount.toLocaleString()} {tokenData.baseToken.symbol}
                </p>
                <p className="text-blue-100 text-sm">
                  ${(existingToken.amount * parseFloat(tokenData.priceUsd)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Token Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                    <p className="text-xs text-gray-500 font-mono">
                      {tokenData.baseToken.address.slice(0, 6)}...{tokenData.baseToken.address.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
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
            <Card className="bg-white shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    24h Price Chart
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchToken()}
                    className="rounded-xl"
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
            <Card className="bg-white shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab('buy')}
                    variant={activeTab === 'buy' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'buy' ? 'bg-green-600 text-white hover:bg-green-700 rounded-xl' : 'rounded-xl'}`}
                  >
                    Buy
                  </Button>
                  <Button
                    onClick={() => setActiveTab('sell')}
                    variant={activeTab === 'sell' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'sell' ? 'bg-red-500 text-white hover:bg-red-600 rounded-xl' : 'rounded-xl'}`}
                  >
                    Sell
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTab === 'buy' ? (
                  <>
                    <div>
                      <Label htmlFor="eth-amount">USDC Amount</Label>
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
                          className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto rounded-xl"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {profile.fakeUSDCBalance.toFixed(2)} USDC
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
                        <span>{fee} USDC</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{(parseFloat(ethAmount || '0') + fee).toFixed(2)} USDC</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleBuy}
                      disabled={!ethAmount || isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] rounded-xl"
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
                          className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto rounded-xl"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {existingToken ? existingToken.amount.toLocaleString() : '0'} {tokenData.baseToken.symbol}
                      </p>
                    </div>

                    <div>
                      <Label>Estimated USDC</Label>
                      <Input
                        value={tokenAmount ? ((parseFloat(tokenAmount) * parseFloat(tokenData.priceUsd) * (1 - slippage / 100)) - fee).toFixed(2) : ''}
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
                          <span>{fee} USDC</span>
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
                      className="w-full bg-red-500 hover:bg-red-600 text-white min-h-[48px] rounded-xl"
                    >
                      {isLoading ? 'Processing...' : `Sell ${tokenData.baseToken.symbol}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trading Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white shadow-lg rounded-2xl">
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
