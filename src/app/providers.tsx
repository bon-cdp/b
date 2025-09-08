"use client";

import { darkTheme } from '@rainbow-me/rainbowkit';
import * as React from "react";
import { CustomQRCode } from './CustomQRCode';

import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Get a Project ID from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

// Configure connectors with mobile support
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        coinbaseWallet,
      ],
    },
  ],
  {
    appName: "SocialBuzz.me",
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [
    base,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [baseSepolia] : []),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

// Custom theme with QR code override
const myTheme = {
  ...darkTheme(),
  connectModalqrCode: ({ value, size }: { value: string; size: number }) => (
    <CustomQRCode value={value} size={size} />
  ),
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={myTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}