
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, BarChart3, Info, User, LogOut, ArrowLeftRight } from 'lucide-react';
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
    { path: '/trade', icon: ArrowLeftRight, label: 'Trade' },
    { path: '/pnl', icon: BarChart3, label: 'P&L' },
    { path: '/about', icon: Info, label: 'About' },
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-30">
        <nav className="backdrop-blur-md bg-white/90 border-b border-gray-200/50 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-2 mr-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold text-xl text-gray-800">Base Wallet</span>
              </div>
              
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : isConnected || item.path === '/' || item.path === '/about'
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
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
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {walletAddress && truncateAddress(walletAddress)}
                    </span>
                  </div>
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowWalletModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/25"
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
        <nav className="backdrop-blur-md bg-white/90 border-t border-gray-200/50 px-2 py-2 shadow-lg">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 p-3 rounded-2xl transition-all duration-200 min-w-[60px] ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50'
                    : isConnected || item.path === '/' || item.path === '/about'
                    ? 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
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
