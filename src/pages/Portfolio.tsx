
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Eye, EyeOff, Brain, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { PortfolioChart } from '@/components/PortfolioChart';
import { TokenCard } from '@/components/TokenCard';
import { WatchlistPanel } from '@/components/WatchlistPanel';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';

const Portfolio = () => {
  const { profile, updateProfile } = useWallet();
  const navigate = useNavigate();
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(true);

  if (!profile) {
    return null;
  }

  const totalPortfolioValue = profile.fakeUSDCBalance + 
    profile.portfolio.reduce((sum, token) => sum + (token.amount * token.lastPrice), 0);

  const totalPnL = profile.portfolio.reduce((sum, token) => 
    sum + ((token.lastPrice - token.buyPrice) * token.amount), 0);

  const bestPerformer = profile.portfolio.reduce((best, token) => {
    const pnl = (token.lastPrice - token.buyPrice) * token.amount;
    const bestPnl = best ? (best.lastPrice - best.buyPrice) * best.amount : -Infinity;
    return pnl > bestPnl ? token : best;
  }, null);

  const worstPerformer = profile.portfolio.reduce((worst, token) => {
    const pnl = (token.lastPrice - token.buyPrice) * token.amount;
    const worstPnl = worst ? (worst.lastPrice - worst.buyPrice) * worst.amount : Infinity;
    return pnl < worstPnl ? token : worst;
  }, null);

  const handleRemoveFromWatchlist = (contractAddress: string) => {
    console.log('Removing from watchlist:', contractAddress);
    const updatedWatchlist = profile.watchlist.filter(addr => addr !== contractAddress);
    console.log('New watchlist:', updatedWatchlist);
    
    updateProfile({
      watchlist: updatedWatchlist
    });
  };

  const handleTradeFromWatchlist = (contractAddress: string) => {
    console.log('Trading from watchlist:', contractAddress);
    navigate(`/trade/${contractAddress}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-32 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-blue-600 mb-2"
            key={profile.fakeUSDCBalance}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5 }}
          >
            ${totalPortfolioValue.toFixed(2)} USDC
          </motion.h1>
          <p className="text-lg text-gray-600">
            Available: ${profile.fakeUSDCBalance.toFixed(2)} USDC
          </p>
          <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ({((totalPnL / 1500) * 100).toFixed(2)}%)
          </div>
        </motion.div>

        {/* Portfolio Summary Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Portfolio Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioChart data={profile.portfolioValueHistory} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Highlights */}
        {(bestPerformer || worstPerformer) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {bestPerformer && (
              <Card 
                className="backdrop-blur-sm bg-green-50/80 border border-green-200/50 shadow-lg cursor-pointer hover:scale-105 transition-all duration-200"
                onClick={() => navigate(`/trade/${bestPerformer.contractAddress}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Best Performer</p>
                      <p className="text-lg font-bold text-green-600">
                        {bestPerformer.symbol} +{(((bestPerformer.lastPrice - bestPerformer.buyPrice) / bestPerformer.buyPrice) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {worstPerformer && (
              <Card 
                className="backdrop-blur-sm bg-red-50/80 border border-red-200/50 shadow-lg cursor-pointer hover:scale-105 transition-all duration-200"
                onClick={() => navigate(`/trade/${worstPerformer.contractAddress}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Worst Performer</p>
                      <p className="text-lg font-bold text-red-600">
                        {worstPerformer.symbol} {(((worstPerformer.lastPrice - worstPerformer.buyPrice) / worstPerformer.buyPrice) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Token Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Token Holdings ({profile.portfolio.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.portfolio.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No tokens in your portfolio yet</p>
                  <Button
                    onClick={() => navigate('/trade')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Trading
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.portfolio.map((token, index) => (
                    <motion.div
                      key={token.contractAddress}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <TokenCard 
                        token={token} 
                        onClick={() => navigate(`/trade/${token.contractAddress}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Watchlist Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Watchlist ({profile.watchlist.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWatchlist(!showWatchlist)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showWatchlist ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {showWatchlist && (
              <CardContent>
                <WatchlistPanel 
                  watchlist={profile.watchlist}
                  onRemove={handleRemoveFromWatchlist}
                  onTrade={handleTradeFromWatchlist}
                />
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-purple-50/80 border border-purple-200/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <CardTitle className="text-xl font-bold text-purple-800">
                    AI Insights ({profile.aiInsights.suggestions.length})
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  {showAIInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {showAIInsights && (
              <CardContent>
                <AIInsightsPanel 
                  insights={profile.aiInsights}
                  onDismiss={(suggestionId) => {
                    updateProfile({
                      aiInsights: {
                        ...profile.aiInsights,
                        dismissedIds: [...profile.aiInsights.dismissedIds, suggestionId]
                      }
                    });
                  }}
                />
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;
