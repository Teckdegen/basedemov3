
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect } = useWallet();

  // Simulate wallet connection (Base chain)
  const handleConnect = async (walletType: string) => {
    setIsConnecting(true);
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock wallet address for demo
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      
      connect(mockAddress);
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="backdrop-blur-md bg-white/95 border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-blue-600">
                    Connect Wallet
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Connect to Base chain (Chain ID: 8453)
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleConnect('metamask')}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ minHeight: '48px' }}
                >
                  {isConnecting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect MetaMask'
                  )}
                </Button>

                <Button
                  onClick={() => handleConnect('walletconnect')}
                  disabled={isConnecting}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ minHeight: '48px' }}
                >
                  WalletConnect
                </Button>

                <Button
                  onClick={() => handleConnect('coinbase')}
                  disabled={isConnecting}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ minHeight: '48px' }}
                >
                  Coinbase Wallet
                </Button>

                <div className="text-center text-xs text-gray-500 mt-4">
                  This is a demo app. No real wallet connection is made.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
