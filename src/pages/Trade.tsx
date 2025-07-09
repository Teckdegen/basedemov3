
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Bell, Heart, Brain, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { TokenChart } from '@/components/TokenChart';

const Trade = () => {
  const { contractAddress } = useParams();
  const navigate = useNavigate();
  const { profile, updateProfile } = useWallet();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [slippage, setSlippage] = useState(0.3);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState({
    symbol: 'PEPE',
    name: 'Pepe Token',
    price: 0.000015,
    change24h: 2.3,
    marketCap: 6500000000,
    liquidity: 2500000,
    volume24h: 1200000,
    logoUrl: ''
  });

  const fee = 0.3;
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

  // Mock token data based on contract address
  useEffect(() => {
    const mockTokens = {
      '0x0000000000000000000000000000000000000000': {
        symbol: 'PEPE',
        name: 'Pepe Token',
        price: 0.000015,
        change24h: 2.3,
        marketCap: 6500000000,
        liquidity: 2500000,
        volume24h: 1200000,
        logoUrl: ''
      },
      '0x1111111111111111111111111111111111111111': {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: 0.082,
        change24h: -1.2,
        marketCap: 11200000000,
        liquidity: 3800000,
        volume24h: 2100000,
        logoUrl: ''
      }
    };

    const token = mockTokens[contractAddress as keyof typeof mockTokens] || {
      ...mockTokens['0x0000000000000000000000000000000000000000'],
      logoUrl: ''
    };
    setTokenData(token);
  }, [contractAddress]);

  // Calculate estimated amounts
  useEffect(() => {
    if (activeTab === 'buy' && usdcAmount) {
      const amount = parseFloat(usdcAmount);
      if (!isNaN(amount)) {
        const tokens = amount / tokenData.price;
        const tokensAfterSlippage = tokens * (1 - slippage / 100);
        setTokenAmount(tokensAfterSlippage.toFixed(0));
      }
    }
  }, [usdcAmount, tokenData.price, slippage, activeTab]);

  const handleBuy = async () => {
    if (!profile || !usdcAmount) return;

    const amount = parseFloat(usdcAmount);
    const total = amount + fee;

    if (total > profile.fakeUSDCBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough USDC in your wallet",
        variant: "destructive"
      });
      return;
    }

    if (amount < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Minimum buy amount is 0.01 USDC",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tokens = amount / tokenData.price;
      const tokensAfterSlippage = tokens * (1 - slippage / 100);

      // Update portfolio
      const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
      let updatedPortfolio;

      if (existingToken) {
        // Update existing token
        const totalAmount = existingToken.amount + tokensAfterSlippage;
        const newBuyPrice = ((existingToken.amount * existingToken.buyPrice) + (tokensAfterSlippage * tokenData.price)) / totalAmount;
        
        updatedPortfolio = profile.portfolio.map(t => 
          t.contractAddress === contractAddress
            ? { ...t, amount: totalAmount, buyPrice: newBuyPrice, lastPrice: tokenData.price }
            : t
        );
      } else {
        // Add new token
        updatedPortfolio = [...profile.portfolio, {
          contractAddress: contractAddress!,
          symbol: tokenData.symbol,
          name: tokenData.name,
          amount: tokensAfterSlippage,
          buyPrice: tokenData.price,
          lastPrice: tokenData.price,
          logoUrl: tokenData.logoUrl
        }];
      }

      // Update trade history
      const newTrade = {
        type: 'BUY' as const,
        token: tokenData.symbol,
        amount: tokensAfterSlippage,
        price: tokenData.price,
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
        description: `Bought ${tokensAfterSlippage.toLocaleString()} ${tokenData.symbol}`,
      });

      // Clear form
      setUsdcAmount('');
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
    if (!profile || !tokenAmount) return;

    const amount = parseFloat(tokenAmount);
    const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);

    if (!existingToken || amount > existingToken.amount) {
      toast({
        title: "Insufficient Tokens",
        description: `Not enough ${tokenData.symbol} in your portfolio`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const usdcReturn = amount * tokenData.price;
      const usdcAfterSlippage = usdcReturn * (1 - slippage / 100);
      const finalAmount = usdcAfterSlippage - fee;

      const profit = (tokenData.price - existingToken.buyPrice) * amount;

      // Update portfolio
      let updatedPortfolio;
      if (existingToken.amount === amount) {
        // Remove token completely
        updatedPortfolio = profile.portfolio.filter(t => t.contractAddress !== contractAddress);
      } else {
        // Reduce amount
        updatedPortfolio = profile.portfolio.map(t => 
          t.contractAddress === contractAddress
            ? { ...t, amount: t.amount - amount, lastPrice: tokenData.price }
            : t
        );
      }

      // Update trade history
      const newTrade = {
        type: 'SELL' as const,
        token: tokenData.symbol,
        amount,
        price: tokenData.price,
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
        description: `Sold ${amount.toLocaleString()} ${tokenData.symbol} for ${finalAmount.toFixed(2)} USDC`,
      });

      setUsdcAmount('');
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
    if (!profile || !contractAddress) return;

    if (profile.watchlist.includes(contractAddress)) {
      toast({
        title: "Already in Watchlist",
        description: `${tokenData.symbol} is already in your watchlist`,
      });
      return;
    }

    updateProfile({
      watchlist: [...profile.watchlist, contractAddress]
    });

    toast({
      title: "Added to Watchlist",
      description: `${tokenData.symbol} added to your watchlist`,
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6 flex items-center justify-center">
        <p>Please connect your wallet to continue</p>
      </div>
    );
  }

  const existingToken = profile.portfolio.find(t => t.contractAddress === contractAddress);
  const isPositive = tokenData.change24h >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

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
                      {tokenData.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      {tokenData.symbol}
                    </CardTitle>
                    <p className="text-gray-600">{tokenData.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ${tokenData.price.toFixed(8)}
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
                    {isPositive ? '+' : ''}{tokenData.change24h.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Market Cap</p>
                  <p className="font-semibold">${(tokenData.marketCap / 1e9).toFixed(2)}B</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Liquidity</p>
                  <p className="font-semibold">${(tokenData.liquidity / 1e6).toFixed(2)}M</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">24h Volume</p>
                  <p className="font-semibold">${(tokenData.volume24h / 1e6).toFixed(2)}M</p>
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
                    className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TokenChart price={tokenData.price} symbol={tokenData.symbol} />
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
                      <Label htmlFor="usdc-amount">USDC Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="usdc-amount"
                          type="number"
                          placeholder="0.00"
                          value={usdcAmount}
                          onChange={(e) => setUsdcAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => setUsdcAmount((profile.fakeUSDCBalance - fee).toFixed(2))}
                          variant="outline"
                          className="min-w-[48px] h-[48px] md:min-w-auto md:h-auto"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Available: ${profile.fakeUSDCBalance.toFixed(2)} USDC
                      </p>
                    </div>

                    <div>
                      <Label>Estimated {tokenData.symbol}</Label>
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
                        <span>${fee.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${(parseFloat(usdcAmount || '0') + fee).toFixed(2)} USDC</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleBuy}
                      disabled={!usdcAmount || isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]"
                    >
                      {isLoading ? 'Processing...' : `Buy ${tokenData.symbol}`}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="token-amount">{tokenData.symbol} Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="token-amount"
                          type="number"
                          placeholder="0"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(e.target.value)}
                          className="flex-1"
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
                        Available: {existingToken ? existingToken.amount.toLocaleString() : '0'} {tokenData.symbol}
                      </p>
                    </div>

                    <div>
                      <Label>Estimated USDC</Label>
                      <Input
                        value={tokenAmount ? ((parseFloat(tokenAmount) * tokenData.price * (1 - slippage / 100)) - fee).toFixed(2) : ''}
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
                          <span>${tokenData.price.toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee:</span>
                          <span>${fee.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Profit/Loss:</span>
                          <span className={`${(tokenData.price - existingToken.buyPrice) * parseFloat(tokenAmount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ${((tokenData.price - existingToken.buyPrice) * parseFloat(tokenAmount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSell}
                      disabled={!tokenAmount || !existingToken || isLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white min-h-[48px]"
                    >
                      {isLoading ? 'Processing...' : `Sell ${tokenData.symbol}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="backdrop-blur-md bg-purple-50/80 border border-purple-200 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-xl font-bold text-purple-800">
                  AI Token Insights
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-purple-100/50 rounded-lg">
                  <p className="text-purple-800 font-medium">Market Sentiment: Positive</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Social media sentiment for {tokenData.symbol} is currently positive with increasing mention volume
                  </p>
                </div>
                <div className="p-3 bg-blue-100/50 rounded-lg">
                  <p className="text-blue-800 font-medium">Technical Analysis</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Price is showing bullish momentum with strong support at current levels
                  </p>
                </div>
                <div className="p-3 bg-orange-100/50 rounded-lg">
                  <p className="text-orange-800 font-medium">Risk Assessment</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Moderate risk - Consider position sizing and take profit levels
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
