
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { WalletModal } from '@/components/WalletModal';
import { Ticker } from '@/components/Ticker';

const Index = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isConnected, walletAddress } = useWallet();
  const navigate = useNavigate();

  const handleConnect = () => {
    setShowWalletModal(true);
  };

  const handleGoToPortfolio = () => {
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-12 h-12 bg-blue-600/10 rounded-full"
            initial={{ y: -100, x: Math.random() * window.innerWidth }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: 360 
            }}
            transition={{ 
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5
            }}
          />
        ))}
      </div>

      {/* Ticker */}
      <Ticker />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-blue-600 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Base Demo: Trade Risk-Free
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-700 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Practice with 1,500 fake USDC on Base blockchain
          </motion.p>

          {/* Connect Wallet Button */}
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ minHeight: '48px' }}
              >
                Connect Wallet
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleGoToPortfolio}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ minHeight: '48px' }}
              >
                Go to Portfolio
              </Button>
            </motion.div>
          )}

          {/* Feature Cards */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card className="backdrop-blur-md bg-white/15 border border-white/20 shadow-xl hover:scale-105 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Simulated Trading</h3>
                <p className="text-gray-600">Trade without risk using fake USDC on Base chain</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/15 border border-white/20 shadow-xl hover:scale-105 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Insights</h3>
                <p className="text-gray-600">Get AI-powered trading recommendations and analysis</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/15 border border-white/20 shadow-xl hover:scale-105 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure Storage</h3>
                <p className="text-gray-600">Data stored locally with multiple wallet support</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Learn More Button */}
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
          >
            <Button
              onClick={() => navigate('/about')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl transition-all duration-200"
              style={{ minHeight: '48px' }}
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <div className="backdrop-blur-md bg-white/15 rounded-xl px-4 py-2 inline-block border border-white/20">
          <p className="text-sm text-gray-600">
            Powered by OpenAI • Privacy Policy • Terms of Service
          </p>
        </div>
      </motion.div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </div>
  );
};

export default Index;
