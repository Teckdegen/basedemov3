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
      console.log('Loading profile on mount...');
      
      // Only load if wallet is actually connected
      if (!isConnected || !address) {
        console.log('No wallet connected, skipping profile load');
        setIsLoading(false);
        return;
      }
      
      const profileKey = `baseDemoProfile_${address}`;
      const existingProfile = localStorage.getItem(profileKey);
      console.log('Existing profile found for connected wallet:', !!existingProfile);
      
      if (existingProfile) {
        try {
          const userProfile = JSON.parse(existingProfile);
          // Validate profile structure
          if (userProfile.walletAddress && typeof userProfile.fakeUSDCBalance === 'number') {
            setProfile(userProfile);
            console.log('Profile loaded successfully:', userProfile.walletAddress);
          } else {
            console.log('Invalid profile structure, removing...');
            localStorage.removeItem(profileKey);
          }
        } catch (error) {
          console.error('Error parsing profile:', error);
          localStorage.removeItem(profileKey);
        }
      }
      setIsLoading(false);
    };

    // Small delay to ensure React has mounted
    const timer = setTimeout(loadProfile, 100);
    return () => clearTimeout(timer);
  }, [isConnected, address]);

  const connect = (address: string) => {
    try {
      console.log('Connecting wallet:', address);
      
      // Validate address format
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('Invalid wallet address format');
      }

      const profileKey = `baseDemoProfile_${address}`;
      const existingProfile = localStorage.getItem(profileKey);
      console.log('Existing profile for address:', !!existingProfile);
      
      let userProfile: WalletProfile;
      
      if (existingProfile) {
        try {
          userProfile = JSON.parse(existingProfile);
          // Validate existing profile
          if (!userProfile.walletAddress || userProfile.fakeUSDCBalance < 0) {
            throw new Error('Corrupted profile data');
          }
          console.log('Existing profile loaded successfully');
          toast({
            title: "Welcome Back!",
            description: `Restored wallet with $${userProfile.fakeUSDCBalance.toFixed(2)} USDC`,
          });
        } catch (error) {
          // If profile is corrupted, create new one
          console.log('Profile corrupted, creating new one');
          userProfile = createNewProfile(address);
          toast({
            title: "Profile Reset",
            description: "Your profile data was corrupted and has been reset to 1,500 USDC.",
            variant: "destructive"
          });
        }
      } else {
        // Create new profile
        console.log('Creating new profile');
        userProfile = createNewProfile(address);
        toast({
          title: "Welcome to Base Wallet!",
          description: "You've been given 1,500 USDC to start trading.",
        });
      }

      // Save profile immediately
      localStorage.setItem(profileKey, JSON.stringify(userProfile));
      localStorage.setItem('lastConnectedWallet', address);

      setProfile(userProfile);
      console.log('Profile connected and saved');

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
    console.log('Disconnecting wallet...');
    
    // Disconnect from wagmi
    wagmiDisconnect();
    
    // Clear the profile state but keep localStorage data for reconnection
    setProfile(null);
    
    // Remove the last connected wallet reference so it doesn't auto-load
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

    console.log('Updating profile with:', updates);
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    const profileKey = `baseDemoProfile_${address}`;
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    
    console.log('Profile updated and saved');
  };

  // Watch for account changes from RainbowKit
  useEffect(() => {
    if (isConnected && address && !isLoading) {
      console.log('Account connected via RainbowKit:', address);
      
      // Check if we already have this profile loaded
      if (!profile || profile.walletAddress !== address) {
        connect(address);
      }
    } else if (!isConnected && !isLoading && profile) {
      console.log('Account disconnected via RainbowKit');
      setProfile(null);
      localStorage.removeItem('lastConnectedWallet');
    }
  }, [isConnected, address, isLoading]);

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
