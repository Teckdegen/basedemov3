
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Analytics } from '@vercel/analytics/react';
import { config } from './lib/wagmi';
import { WalletProvider } from "@/hooks/useWallet";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Trade from "./pages/Trade";
import PnL from "./pages/PnL";
import NotFound from "./pages/NotFound";

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        <TooltipProvider>
          <WalletProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navigation />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/trade/:contractAddress" element={<Trade />} />
                <Route path="/pnl" element={<PnL />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Analytics />
          </WalletProvider>
        </TooltipProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
