"use client";

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Market, ExtractedContent } from './ActivityFeed';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount } from 'wagmi';

interface TradeModalProps {
    market: Market | null;
    onClose: () => void;
    renderContent: (content: ExtractedContent) => ReactNode; 
    onTradeSuccess: (updatedMarket: Market) => void;
}

interface PriceHistoryPoint {
    timestamp: string;
    price: string;
}

interface ChartDataPoint {
    time: string;
    price: number;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TradeModal({ market, onClose, renderContent, onTradeSuccess }: TradeModalProps) {
    const [history, setHistory] = useState<ChartDataPoint[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    const [buyAmount, setBuyAmount] = useState<number | string>("");
    const [sellAmount, setSellAmount] = useState<number | string>("");

    const [isTrading, setIsTrading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const { address } = useAccount();

    useEffect(() => {
        if (market) {
            setIsLoadingHistory(true);
            setBuyAmount("");
            setSellAmount("");
            setStatusMessage("");
            
            const fetchHistory = async () => {
                if (!apiBaseUrl) return;
                try {
                    const response = await fetch(`${apiBaseUrl}/markets/${market.id}/history`);
                    if (!response.ok) throw new Error("Failed to fetch market history");
                    const data: PriceHistoryPoint[] = await response.json();
                    
                    const formattedData: ChartDataPoint[] = data.map(p => ({
                        time: new Date(p.timestamp).toLocaleTimeString(),
                        price: parseFloat(p.price)
                    }));
                    setHistory(formattedData);
                } catch (error) {
                    console.error("Error fetching market history:", error);
                    setHistory([]);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [market]);

    const executeTrade = async (tradeType: 'buy' | 'sell', amount: number | string) => {
        if (!market || !address || !amount || +amount <= 0 || !apiBaseUrl) {
            setStatusMessage("Please enter a valid amount.");
            return;
        }
        setIsTrading(true);
        setStatusMessage(`Processing ${tradeType}...`);
        try {
            const response = await fetch(`${apiBaseUrl}/markets/${tradeType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    market_id: market.id,
                    user_address: address,
                    amount: Number(amount),
                }),
            });
            const data = await response.json();
            if (!response.ok || data.status !== 'success') {
                 throw new Error(data.message || `${tradeType.toUpperCase()} failed.`);
            }
            
            setStatusMessage(`Success! Shares ${tradeType === 'buy' ? 'bought' : 'sold'}.`);
            onTradeSuccess(data.market);
            
            if (tradeType === 'buy') setBuyAmount("");
            else setSellAmount("");
            
        } catch (error: unknown) {
            if (error instanceof Error) {
                setStatusMessage(`Error: ${error.message}`);
            } else {
                setStatusMessage('An unknown error occurred during the trade.');
            }
        } finally {
            setIsTrading(false);
        }
    };

    if (!market) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-60 p-4"
            onClick={onClose}
        >
            {/* FIX: Removed overflow-y-auto from here to handle scrolling internally */}
            <div 
                className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- HEADER (Now sticky) --- */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Trade Market #{market.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                {/* --- SCROLLABLE CONTENT AREA --- */}
                {/* FIX: This div now handles the scrolling */}
                <div className="overflow-y-auto">
                    <div className="p-4 space-y-6">
                        <div className="rounded-lg border border-gray-700 p-4">
                            {renderContent(market.content)}
                            <div className="border-t border-gray-700 mt-4 pt-2 flex justify-between items-center text-sm text-gray-400">
                                <span>Creator: {market.creator.slice(0, 6)}...{market.creator.slice(-4)}</span>
                                <span>Total Supply: {market.supply.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="h-64 bg-gray-800/50 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                            {history.length > 0 ? (
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis dataKey="time" stroke="#A0AEC0" />
                                        <YAxis stroke="#A0AEC0" domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}/>
                                        <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                                    </LineChart>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    {isLoadingHistory ? "Loading Chart..." : "No trade history available."}
                                </div>
                            )}
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                <h3 className="font-bold text-lg text-green-400">Buy Shares</h3>
                                <input 
                                    type="number"
                                    placeholder="Amount of shares"
                                    value={buyAmount}
                                    onChange={(e) => setBuyAmount(e.target.value)}
                                    disabled={isTrading}
                                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
                                />
                                <button onClick={() => executeTrade('buy', buyAmount)} disabled={isTrading || !buyAmount} className="w-full rounded-md bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50">
                                    {isTrading ? 'Processing...' : 'Buy'}
                                </button>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                <h3 className="font-bold text-lg text-red-400">Sell Shares</h3>
                                <input 
                                    type="number"
                                    placeholder="Amount of shares"
                                    value={sellAmount}
                                    onChange={(e) => setSellAmount(e.target.value)}
                                    disabled={isTrading}
                                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none disabled:opacity-50"
                                />
                                <button onClick={() => executeTrade('sell', sellAmount)} disabled={isTrading || !sellAmount} className="w-full rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50">
                                    {isTrading ? 'Processing...' : 'Sell'}
                                </button>
                            </div>
                        </div>
                        {statusMessage && <p className="text-center text-sm text-gray-400 mt-2">{statusMessage}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}