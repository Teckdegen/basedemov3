
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Base Demo',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [base],
  ssr: false,
});
