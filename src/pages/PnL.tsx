
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { PnLChart } from '@/components/PnLChart';

const PnL = () => {
  const { profile } = useWallet();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState('24h');

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6 flex items-center justify-center">
        <p>Please connect your wallet to view P&L</p>
      </div>
    );
  }

  const totalPortfolioValue = profile.fakeUSDCBalance + 
    profile.portfolio.reduce((sum, token) => sum + (token.amount * token.lastPrice), 0);

  const totalPnL = profile.portfolio.reduce((sum, token) => 
    sum + ((token.lastPrice - token.buyPrice) * token.amount), 0);

  const totalInvested = 1500; // Starting amount
  const totalReturn = ((totalPortfolioValue - totalInvested) / totalInvested) * 100;

  // Calculate 24h change (mock)
  const change24h = Math.random() * 10 - 5; // Random change between -5% and 5%

  const bestPerformer = profile.portfolio.reduce((best, token) => {
    if (!best) return token;
    const tokenPnL = ((token.lastPrice - token.buyPrice) / token.buyPrice) * 100;
    const bestPnL = ((best.lastPrice - best.buyPrice) / best.buyPrice) * 100;
    return tokenPnL > bestPnL ? token : best;
  }, null);

  const worstPerformer = profile.portfolio.reduce((worst, token) => {
    if (!worst) return token;
    const tokenPnL = ((token.lastPrice - token.buyPrice) / token.buyPrice) * 100;
    const worstPnL = ((worst.lastPrice - worst.buyPrice) / worst.buyPrice) * 100;
    return tokenPnL < worstPnL ? token : worst;
  }, null);

  const exportData = (format: 'csv' | 'png') => {
    if (format === 'csv') {
      const csvData = [
        ['Token', 'Amount', 'Buy Price', 'Current Price', 'P&L USD', 'P&L %'],
        ...profile.portfolio.map(token => [
          token.symbol,
          token.amount.toString(),
          token.buyPrice.toString(),
          token.lastPrice.toString(),
          ((token.lastPrice - token.buyPrice) * token.amount).toFixed(2),
          (((token.lastPrice - token.buyPrice) / token.buyPrice) * 100).toFixed(2) + '%'
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio_pnl_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Portfolio data exported to CSV",
      });
    } else {
      toast({
        title: "Export PNG",
        description: "PNG export feature coming soon",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Portfolio Analytics
          </h1>
          <div className={`text-lg font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            Portfolio {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Portfolio Value</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${totalPortfolioValue.toFixed(2)}
              </p>
              <p className={`text-sm ${change24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total P&L</h3>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
              <p className={`text-sm ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Available USDC</h3>
              <p className="text-2xl font-bold text-gray-800">
                ${profile.fakeUSDCBalance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {((profile.fakeUSDCBalance / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
              </p>
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
              <Card className="backdrop-blur-md bg-green-50/80 border border-green-200 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Best Performer</p>
                      <p className="text-lg font-bold text-green-600">
                        {bestPerformer.symbol} +{(((bestPerformer.lastPrice - bestPerformer.buyPrice) / bestPerformer.buyPrice) * 100).toFixed(2)}%
                      </p>
                      <p className="text-sm text-green-600">
                        +${((bestPerformer.lastPrice - bestPerformer.buyPrice) * bestPerformer.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {worstPerformer && (
              <Card className="backdrop-blur-md bg-red-50/80 border border-red-200 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Worst Performer</p>
                      <p className="text-lg font-bold text-red-600">
                        {worstPerformer.symbol} {(((worstPerformer.lastPrice - worstPerformer.buyPrice) / worstPerformer.buyPrice) * 100).toFixed(2)}%
                      </p>
                      <p className="text-sm text-red-600">
                        ${((worstPerformer.lastPrice - worstPerformer.buyPrice) * worstPerformer.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Portfolio Analytics
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="1h">1H</option>
                    <option value="6h">6H</option>
                    <option value="24h">24H</option>
                    <option value="7d">7D</option>
                    <option value="all">All Time</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[32px] h-[32px] p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PnLChart 
                portfolio={profile.portfolio} 
                portfolioHistory={profile.portfolioValueHistory}
                usdcBalance={profile.fakeUSDCBalance}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Holdings Breakdown
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => exportData('csv')}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportData('png')}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">PNG</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile.portfolio.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tokens in your portfolio</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-800">Token</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800">Amount</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800">Buy Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800">Current Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800">Value</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.portfolio.map((token) => {
                        const currentValue = token.amount * token.lastPrice;
                        const pnl = (token.lastPrice - token.buyPrice) * token.amount;
                        const pnlPercentage = ((token.lastPrice - token.buyPrice) / token.buyPrice) * 100;
                        const isPositive = pnl >= 0;

                        return (
                          <tr key={token.contractAddress} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">
                                    {token.symbol.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{token.symbol}</p>
                                  <p className="text-sm text-gray-600">{token.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-800">
                              {token.amount.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-800">
                              ${token.buyPrice.toFixed(8)}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-800">
                              ${token.lastPrice.toFixed(8)}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-gray-800">
                              ${currentValue.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}${pnl.toFixed(2)}
                              </div>
                              <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PnL;
