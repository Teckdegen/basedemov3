
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { WalletModal } from '@/components/WalletModal';
import { Ticker } from '@/components/Ticker';

const Index = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isConnected, profile } = useWallet();
  const navigate = useNavigate();

  const handleConnect = () => {
    setShowWalletModal(true);
  };

  const handleGoToPortfolio = () => {
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-20 md:pb-6">
      {/* Ticker */}
      <Ticker />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl shadow-lg border border-gray-200">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Base Demo</h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Practice cryptocurrency trading risk-free with 1,500 fake USDC on Base blockchain
          </p>

          {/* Balance Display for Connected Users */}
          {isConnected && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white max-w-md mx-auto"
            >
              <p className="text-blue-100 mb-1">Your Balance</p>
              <p className="text-3xl font-bold">{profile.fakeUSDCBalance.toFixed(2)} USDC</p>
              <p className="text-blue-100 text-sm">${profile.fakeUSDCBalance.toFixed(2)}</p>
            </motion.div>
          )}

          {/* Action Button */}
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
              >
                Connect Wallet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={handleGoToPortfolio}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
              >
                View Portfolio
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/trade')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
              >
                Start Trading
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card className="bg-white/80 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Risk-Free Trading</h3>
              <p className="text-gray-600">Trade without risk using fake USDC on Base chain</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Insights</h3>
              <p className="text-gray-600">Get AI-powered trading recommendations and analysis</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure Storage</h3>
              <p className="text-gray-600">Data stored locally with multiple wallet support</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section for Connected Users */}
        {isConnected && profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="bg-white/80 border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Portfolio</p>
                <p className="text-xl font-bold text-gray-800">{profile.portfolio.length}</p>
                <p className="text-xs text-gray-500">Tokens</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Trades</p>
                <p className="text-xl font-bold text-gray-800">{profile.tradeHistory.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Watchlist</p>
                <p className="text-xl font-bold text-gray-800">{profile.watchlist.length}</p>
                <p className="text-xs text-gray-500">Items</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(profile.fakeUSDCBalance + profile.portfolio.reduce((sum, t) => sum + (t.amount * t.lastPrice), 0)).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">USD</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </div>
  );
};

export default Index;
