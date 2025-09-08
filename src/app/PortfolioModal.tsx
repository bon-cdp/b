"use client";

import { useState, useEffect } from "react";
import { Market, MarketCard } from "./ActivityFeed";

// The portfolio item from the API includes the user's balance
export type PortfolioItem = Market & {
    balance: number;
};

interface PortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    userAddress?: `0x${string}`;
    onSelectMarket: (market: Market) => void;
}

// --- Centralized Environment Variable ---
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function PortfolioModal({ isOpen, onClose, userAddress, onSelectMarket }: PortfolioModalProps) {
    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            if (!userAddress || !apiBaseUrl) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${apiBaseUrl}/users/${userAddress}/portfolio`);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || "Failed to fetch portfolio");
                }
                const data: PortfolioItem[] = await response.json();
                setPortfolioItems(data);
            } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
                console.error("Portfolio fetch error:", err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred while fetching the portfolio.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchPortfolio();
        }
    }, [isOpen, userAddress]);

    if (!isOpen) {
        return null;
    }

    const handleOpenTradeModal = (market: Market) => {
        onClose(); // Close this modal first
        onSelectMarket(market); // Then open the trade modal via parent state
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex justify-center items-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">My Portfolio</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto flex-grow space-y-4 pr-2 -mr-2">
                    {isLoading && (
                        <div className="text-center py-10 text-gray-400">Loading your holdings...</div>
                    )}
                    {error && (
                        <div className="text-center py-10 text-red-400">Error: {error}</div>
                    )}
                    {!isLoading && !error && portfolioItems.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            You do not own shares in any active markets yet.
                        </div>
                    )}
                    {!isLoading && !error && portfolioItems.map(item => (
                        <MarketCard
                            key={item.id}
                            market={item}
                            userBalance={item.balance}
                            onOpenTradeModal={handleOpenTradeModal}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}