
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, BarChart3, Info, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { WalletModal } from '@/components/WalletModal';

export const Navigation = () => {
  const location = useLocation();
  const { isConnected, walletAddress, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/portfolio', icon: TrendingUp, label: 'Portfolio' },
    { path: '/pnl', icon: BarChart3, label: 'P&L' },
    { path: '/about', icon: Info, label: 'About' },
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block fixed top-16 left-0 right-0 z-30">
        <nav className="backdrop-blur-md bg-white/15 border-b border-white/20 px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : isConnected || item.path === '/' || item.path === '/about'
                      ? 'text-gray-700 hover:bg-white/20 hover:text-blue-600'
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  onClick={(e) => {
                    if (!isConnected && item.path !== '/' && item.path !== '/about') {
                      e.preventDefault();
                      setShowWalletModal(true);
                    }
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600/10 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {walletAddress && truncateAddress(walletAddress)}
                    </span>
                  </div>
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowWalletModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        <nav className="backdrop-blur-md bg-white/15 border-t border-white/20 px-4 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : isConnected || item.path === '/' || item.path === '/about'
                    ? 'text-gray-600 hover:text-blue-600'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
                style={{ minWidth: '48px', minHeight: '48px' }}
                onClick={(e) => {
                  if (!isConnected && item.path !== '/' && item.path !== '/about') {
                    e.preventDefault();
                    setShowWalletModal(true);
                  }
                }}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <WalletModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
};
