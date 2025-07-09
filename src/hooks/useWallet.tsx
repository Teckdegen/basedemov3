import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

interface WalletProfile {
  walletAddress: string;
  fakeUSDCBalance: number;
  portfolio: TokenHolding[];
  tradeHistory: Trade[];
  aiInsights: {
    lastUpdated: string | null;
    suggestions: AISuggestion[];
    dismissedIds: string[];
    tokenInsights: Record<string, any>;
  };
  watchlist: string[];
  portfolioValueHistory: { timestamp: string; totalValue: number }[];
  totalPnL: number;
  alerts: PriceAlert[];
  achievements: Achievement[];
  settings: {
    theme: 'light' | 'dark';
    refreshInterval: number;
    chartTimeframe: string;
    language: string;
  };
  searchCache: any[];
}

interface TokenHolding {
  contractAddress: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number;
  lastPrice: number;
  logoUrl?: string;
}

interface Trade {
  type: 'BUY' | 'SELL' | 'UNDO';
  token: string;
  amount: number;
  price: number;
  usdcValue: number;
  slippage?: number;
  fee?: number;
  profitLoss?: number;
  timestamp: string;
}

interface AISuggestion {
  id: string;
  type: string;
  message: string;
  token?: string;
  dismissed?: boolean;
  timestamp: string;
}

interface PriceAlert {
  id: string;
  token: string;
  contractAddress: string;
  price: number;
  condition: 'above' | 'below';
  created: string;
  triggered?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: string;
}

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  profile: WalletProfile | null;
  connect: (address: string) => void;
  disconnect: () => void;
  switchWallet: (address: string) => void;
  updateProfile: (updates: Partial<WalletProfile>) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const createNewProfile = (address: string): WalletProfile => {
    return {
      walletAddress: address,
      fakeUSDCBalance: 1500,
      portfolio: [],
      tradeHistory: [],
      aiInsights: {
        lastUpdated: null,
        suggestions: [],
        dismissedIds: [],
        tokenInsights: {}
      },
      watchlist: [],
      portfolioValueHistory: [{
        timestamp: new Date().toISOString(),
        totalValue: 1500
      }],
      totalPnL: 0,
      alerts: [],
      achievements: [],
      settings: {
        theme: 'light',
        refreshInterval: 30,
        chartTimeframe: '24h',
        language: 'en'
      },
      searchCache: []
    };
  };

  const connect = (address: string) => {
    try {
      // Validate address format
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('Invalid wallet address format');
      }

      const profileKey = `baseDemoProfile_${address}`;
      const existingProfile = localStorage.getItem(profileKey);
      
      let userProfile: WalletProfile;
      
      if (existingProfile) {
        try {
          userProfile = JSON.parse(existingProfile);
          // Validate existing profile
          if (!userProfile.walletAddress || userProfile.fakeUSDCBalance < 0) {
            throw new Error('Corrupted profile data');
          }
        } catch (error) {
          // If profile is corrupted, create new one
          userProfile = createNewProfile(address);
          toast({
            title: "Profile Reset",
            description: "Your profile data was corrupted and has been reset to 1,500 USDC.",
            variant: "destructive"
          });
        }
      } else {
        // Create new profile
        userProfile = createNewProfile(address);
        toast({
          title: "Welcome to Base Demo!",
          description: "You've been given 1,500 fake USDC to start trading.",
        });
      }

      // Save profile
      localStorage.setItem(profileKey, JSON.stringify(userProfile));
      localStorage.setItem('lastConnectedWallet', address);

      setProfile(userProfile);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const disconnect = () => {
    wagmiDisconnect();
    setProfile(null);
    localStorage.removeItem('lastConnectedWallet');
    
    toast({
      title: "Wallet Disconnected",
      description: "You have been disconnected from your wallet.",
    });
  };

  const switchWallet = (address: string) => {
    disconnect();
    setTimeout(() => connect(address), 100);
  };

  const updateProfile = (updates: Partial<WalletProfile>) => {
    if (!profile || !address) return;

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    const profileKey = `baseDemoProfile_${address}`;
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
  };

  // Watch for account changes from RainbowKit
  useEffect(() => {
    if (isConnected && address) {
      connect(address);
    } else if (!isConnected) {
      setProfile(null);
    }
  }, [isConnected, address]);

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletAddress: address || null,
      profile,
      connect,
      disconnect,
      switchWallet,
      updateProfile
    }}>
      {children}
    </WalletContext.Provider>
  );
};
