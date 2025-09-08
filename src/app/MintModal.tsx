"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ActivityFeed, { ExtractedContent } from "./ActivityFeed";

type MintStage = 'idle' | 'previewing' | 'readyToMint' | 'submitting' | 'success' | 'error';

interface MintState {
    stage: MintStage;
    message: string;
}

const INITIAL_MINT_STATE: MintState = { stage: 'idle', message: '' };

const scraperApiUrl = process.env.NEXT_PUBLIC_SCRAPER_API_URL;
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

interface MintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMintSuccess: () => void;
}

export default function MintModal({ isOpen, onClose, onMintSuccess }: MintModalProps) {
    const [url, setUrl] = useState("");
    const [mintState, setMintState] = useState<MintState>(INITIAL_MINT_STATE);
    const [previewContent, setPreviewContent] = useState<ExtractedContent | null>(null);
    const { address, isConnected } = useAccount();

    const handlePreview = async () => {
        if (!url || !scraperApiUrl) {
            setMintState({ stage: 'error', message: 'Scraper API URL is not configured.' });
            return;
        };
        setMintState({ stage: 'previewing', message: 'Generating preview...' });
        setPreviewContent(null);

        try {
            const response = await fetch(`${scraperApiUrl}/extract`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to get preview.");
            setPreviewContent(data);
            setMintState({ stage: 'readyToMint', message: 'Preview generated. Ready to mint.' });
        } catch (error: unknown) {
             if (error instanceof Error) {
                setMintState({ stage: 'error', message: `Error: ${error.message}` });
            } else {
                setMintState({ stage: 'error', message: `An unknown error occurred during preview.` });
            }
        }
    };

    const handleMint = async () => {
        if (!url || !isConnected || !address || !apiBaseUrl) {
            setMintState({ stage: 'error', message: 'API URL is not configured or wallet not connected.' });
            return;
        }
        setMintState({ stage: 'submitting', message: 'Submitting to sequencer...' });

        try {
            const response = await fetch(`${apiBaseUrl}/markets/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: address,
                    url: url,
                }),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Minting failed.");
            
            setMintState({ stage: 'success', message: 'Success! Market created.' });
            onMintSuccess();
            setTimeout(handleClose, 1500);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMintState({ stage: 'error', message: `Error: ${error.message}` });
            } else {
                setMintState({ stage: 'error', message: `An unknown error occurred during minting.` });
            }
        }
    };
    
    const handleClose = () => {
        setUrl("");
        setPreviewContent(null);
        setMintState(INITIAL_MINT_STATE);
        onClose();
    };

    if (!isOpen) return null;

    const isProcessing = mintState.stage === 'previewing' || mintState.stage === 'submitting';

    return (
        <div
            className="fixed inset-0 bg-black/60 z-60 flex justify-center items-center p-4"
            onClick={handleClose}
        >
            {/* FIX: Added flex, flex-col, and a gap to structure the modal for scrolling */}
            <div
                className="bg-gray-800 rounded-lg p-5 w-full max-w-md relative shadow-xl flex flex-col max-h-[90vh] gap-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                {/* --- HEADER (Stays fixed) --- */}
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">Create New Market</h2>
                </div>
                
                {/* --- INPUT AREA (Stays fixed) --- */}
                <div className="flex-shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => { 
                                setUrl(e.target.value); 
                                setPreviewContent(null);
                                if (mintState.stage === 'error' || mintState.stage === 'readyToMint') {
                                    setMintState(INITIAL_MINT_STATE);
                                }
                            }}
                            placeholder="https://x.com/..."
                            className="flex-grow rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                            disabled={isProcessing}
                        />
                        <button 
                            onClick={handlePreview} 
                            className="rounded-md bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700 disabled:opacity-50" 
                            disabled={isProcessing || !url}
                        >
                            Preview
                        </button>
                    </div>
                    {mintState.message && <p className="text-center text-sm text-gray-400 mt-2">{mintState.message}</p>}
                </div>


                {/* --- SCROLLABLE CONTENT AREA --- */}
                {previewContent && address && (
                    // FIX: This div will now grow and scroll internally if the content is too long.
                    <div className="flex-grow overflow-y-auto pr-2 -mr-3">
                        <ActivityFeed previewMarket={{ id: -1, url, creator: address, supply: 1000000, content: previewContent }} />
                    </div>
                )}
                
                {/* --- FOOTER (Stays fixed) --- */}
                {previewContent && address && (
                     <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleMint} 
                            className="w-full rounded-md bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50" 
                            disabled={mintState.stage !== 'readyToMint'}
                        >
                            Mint
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}