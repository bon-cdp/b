"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import useWebSocket from "react-use-websocket";
import ActivityFeed, { Market, renderContent } from "./ActivityFeed";
import TradeModal from "./TradeModal";
import MintModal from "./MintModal";
import PortfolioModal from "./PortfolioModal";

type FeedType = 'Top' | 'Live';

// --- Centralized Environment Variables ---
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [activeFeed, setActiveFeed] = useState<FeedType>('Top');
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  const { address, isConnected } = useAccount();

  const fetchMarkets = async () => {
    const endpointPath = activeFeed === 'Top' ? 'markets/top' : 'markets';
    const endpoint = `${apiBaseUrl}/${endpointPath}`;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch ${activeFeed.toLowerCase()} markets`);
      const data: Market[] = await response.json();
      setMarkets(data);
    } catch (error) {
      console.error(`Failed to fetch ${activeFeed.toLowerCase()} markets:`, error);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [activeFeed]);
  
  // Use the dedicated WebSocket URL environment variable
  const { lastMessage } = useWebSocket(wsUrl, {
    shouldReconnect: () => true,
  }, !!wsUrl); // Only connect if the URL is provided

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const event = JSON.parse(lastMessage.data);
        if (event.type === 'NEW_MINT' && activeFeed === 'Live') {
          setMarkets(prev =>
            prev.find(m => m.url === event.market.url)
              ? prev
              : [event.market, ...prev]
          );
        }
      } catch (e) { console.error("Failed to parse WebSocket message:", e); }
    }
  }, [lastMessage, activeFeed]);
  
  const handleTradeSuccess = (updatedMarket: Market) => {
    setMarkets(prevMarkets => 
      prevMarkets.map(m => m.id === updatedMarket.id ? updatedMarket : m)
    );
    setSelectedMarket(updatedMarket);
  };

  const TabButton = ({ label, type }: { label: string; type: FeedType }) => (
    <button
      onClick={() => setActiveFeed(type)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeFeed === type
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <TradeModal
        market={selectedMarket}
        onClose={() => setSelectedMarket(null)}
        renderContent={renderContent}
        onTradeSuccess={handleTradeSuccess}
      />

      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onMintSuccess={fetchMarkets}
      />
      
      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        userAddress={address}
        onSelectMarket={(market) => {
            setIsPortfolioModalOpen(false);
            setSelectedMarket(market);
        }}
      />

      <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white">
        <header className="sticky top-0 z-50 w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
          <div className="container mx-auto flex items-center justify-between p-4 max-w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight flex-shrink-0">
              socialbuzz<span className="text-blue-400">.me</span>
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink min-w-0">
              {isConnected && (
                  <button
                      onClick={() => setIsPortfolioModalOpen(true)}
                      className="px-2 py-2 sm:px-4 text-xs sm:text-sm font-bold rounded-md transition-colors bg-gray-700 text-white hover:bg-gray-600 flex-shrink-0"
                  >
                      Portfolio
                  </button>
              )}
              <div className="flex-shrink min-w-0">
                <ConnectButton />
              </div>
            </div>
          </div>
        </header>

        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-4 flex items-center justify-between p-1 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex space-x-2">
                <TabButton label="🏆 Top" type="Top" />
                <TabButton label="⚡ Live" type="Live" />
              </div>
              {isConnected && (
                <button
                  onClick={() => setIsMintModalOpen(true)}
                  className="px-4 py-2 text-sm font-bold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  Mint
                </button>
              )}
            </div>

            <ActivityFeed
              feedType={activeFeed}
              markets={markets}
              onOpenTradeModal={setSelectedMarket}
            />
          </div>
        </div>
      </main>
    </>
  );
}