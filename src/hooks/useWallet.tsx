
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
  const [isLoading, setIsLoading] = useState(true);
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

  // Load profile from localStorage on mount
  useEffect(() => {
    const loadProfile = () => {
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      
      if (lastConnectedWallet) {
        const profileKey = `baseDemoProfile_${lastConnectedWallet}`;
        const existingProfile = localStorage.getItem(profileKey);
        
        if (existingProfile) {
          try {
            const userProfile = JSON.parse(existingProfile);
            // Validate profile structure
            if (userProfile.walletAddress && typeof userProfile.fakeUSDCBalance === 'number') {
              setProfile(userProfile);
              console.log('Profile loaded from localStorage:', userProfile);
            }
          } catch (error) {
            console.error('Error parsing profile:', error);
            localStorage.removeItem(profileKey);
            localStorage.removeItem('lastConnectedWallet');
          }
        }
      }
      setIsLoading(false);
    };

    // Small delay to ensure React has mounted
    const timer = setTimeout(loadProfile, 100);
    return () => clearTimeout(timer);
  }, []);

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
          console.log('Existing profile loaded:', userProfile);
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
          title: "Welcome to Base Wallet!",
          description: "You've been given 1,500 fake ETH to start trading.",
        });
      }

      // Save profile immediately
      localStorage.setItem(profileKey, JSON.stringify(userProfile));
      localStorage.setItem('lastConnectedWallet', address);

      setProfile(userProfile);
      console.log('Profile connected and saved:', userProfile);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

    } catch (error) {
      console.error('Connection error:', error);
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
    if (!profile || !address) {
      console.warn('Cannot update profile: no profile or address');
      return;
    }

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    const profileKey = `baseDemoProfile_${address}`;
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    
    console.log('Profile updated and saved:', updatedProfile);
  };

  // Watch for account changes from RainbowKit
  useEffect(() => {
    if (isConnected && address && !isLoading) {
      connect(address);
    } else if (!isConnected && !isLoading) {
      setProfile(null);
    }
  }, [isConnected, address, isLoading]);

  // Auto-reconnect on page load if wallet was previously connected
  useEffect(() => {
    if (!isLoading && !isConnected && !profile) {
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      if (lastConnectedWallet) {
        // Don't auto-connect, just load the profile data for display
        const profileKey = `baseDemoProfile_${lastConnectedWallet}`;
        const existingProfile = localStorage.getItem(profileKey);
        if (existingProfile) {
          try {
            const userProfile = JSON.parse(existingProfile);
            console.log('Profile data available but wallet not connected');
          } catch (error) {
            console.error('Error loading cached profile:', error);
          }
        }
      }
    }
  }, [isLoading, isConnected, profile]);

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
