"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// --- Type Definitions ---
interface TweetContent {
  author_name: string;
  author_handle: string;
  text: string;
  media?: { Image?: string; Video?: string };
}
interface ArticleContent {
    title: string;
    author: string;
}
interface TikTokVideoContent {
    video_url: string;
    author_handle: string;
    text: string;
}
interface InstagramImageContent {
    image_url: string;
    text: string;
}
interface InstagramReelContent {
    video_url: string;
    text: string;
}
interface GenericLinkContent {
    title: string;
    description?: string;
    image_url?: string;
}
export type ExtractedContent =
  | { Tweet: TweetContent }
  | { Article: ArticleContent }
  | { TikTokVideo: TikTokVideoContent }
  | { InstagramImage: InstagramImageContent }
  | { InstagramReel: InstagramReelContent }
  | { GenericLink: GenericLinkContent };

export interface Market {
  id: number;
  url: string;
  creator: string;
  supply: number;
  content: ExtractedContent;
  ai_analysis?: string | null;
}

interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

// --- Centralized Environment Variable ---
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const SparklineChart = ({ data }: { data: PriceHistoryPoint[] }) => {
    if (!data || data.length < 2) return null;

    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const strokeColor = lastPrice >= firstPrice ? '#22c55e' : '#ef4444'; // green-500 or red-500

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line
                    type="monotone"
                    dataKey="price"
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

const resolveMediaUrl = (path?: string): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('/media/')) {
    return `${apiBaseUrl}${path}`;
  }
  return path;
};

// --- Renderer Components ---
const MediaContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-600">
        {children}
    </div>
);

const ArticleCard = ({ content }: { content: ArticleContent }) => (
  <div>
    <h3 className="text-lg font-bold text-white break-words">{content.title}</h3>
    <p className="text-sm text-gray-400 break-words">By {content.author}</p>
  </div>
);

const TweetCard = ({ content }: { content: TweetContent }) => {
  const videoUrl = resolveMediaUrl(content.media?.Video);
  const imageUrl = resolveMediaUrl(content.media?.Image);
  const hasMedia = videoUrl || imageUrl;

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-white">{content.author_name}</span>
        <span className="text-gray-400">@{content.author_handle}</span>
      </div>
      <p className="mt-2 text-gray-300 whitespace-pre-wrap break-words">{content.text}</p>

      {hasMedia && (
        <div className="mt-3">
          <MediaContainer>
              {videoUrl && <video src={videoUrl} autoPlay muted loop playsInline controls className="w-full h-full aspect-video bg-black object-contain" />}
              {imageUrl && !videoUrl && <Image src={imageUrl} alt="Tweet media" fill className="object-cover" />}
          </MediaContainer>
        </div>
      )}
    </div>
  );
};

const TikTokCard = ({ content }: { content: TikTokVideoContent }) => (
  <div>
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-600 aspect-[9/16] max-h-[600px]">
        <video src={resolveMediaUrl(content.video_url)} autoPlay muted loop playsInline controls className="w-full h-full object-contain bg-black" />
    </div>
    <div className="mt-2">
      <span className="font-bold text-white">@{content.author_handle}</span>
      <p className="text-gray-300 break-words">{content.text}</p>
    </div>
  </div>
);

const InstagramImageCard = ({ content }: { content: InstagramImageContent }) => (
  <div>
    <MediaContainer>
        <Image src={resolveMediaUrl(content.image_url) || ''} alt="Instagram content" fill className="object-cover" />
    </MediaContainer>
    <p className="mt-2 text-gray-300 break-words">{content.text}</p>
  </div>
);

const InstagramReelCard = ({ content }: { content: InstagramReelContent }) => (
  <div>
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-600 aspect-[9/16] max-h-[600px]">
      <video src={resolveMediaUrl(content.video_url)} autoPlay muted loop playsInline controls className="w-full h-full object-contain bg-black" />
    </div>
    <p className="mt-2 text-gray-300 break-words">{content.text}</p>
  </div>
);

const GenericLinkCard = ({ content }: { content: GenericLinkContent }) => (
  <div>
    {content.image_url && (
      <div className="mb-3">
        <MediaContainer>
            <Image src={resolveMediaUrl(content.image_url) || ''} alt="Link preview" fill className="object-cover" />
        </MediaContainer>
      </div>
    )}
    <h3 className="text-lg font-bold text-white break-words">{content.title}</h3>
    {content.description && <p className="text-sm text-gray-400 break-words">{content.description}</p>}
  </div>
);

export const renderContent = (content: ExtractedContent) => {
  if ("Tweet" in content) return <TweetCard content={content.Tweet} />;
  if ("Article" in content) return <ArticleCard content={content.Article} />;
  if ("TikTokVideo" in content) return <TikTokCard content={content.TikTokVideo} />;
  if ("InstagramImage" in content) return <InstagramImageCard content={content.InstagramImage} />;
  if ("InstagramReel" in content) return <InstagramReelCard content={content.InstagramReel} />;
  if ("GenericLink" in content) return <GenericLinkCard content={content.GenericLink} />;
  return <p className="text-red-500">Unsupported content type</p>;
};

interface MarketCardProps {
    market: Market;
    onOpenTradeModal: (market: Market) => void;
    userBalance?: number;
}

export function MarketCard({ market, onOpenTradeModal, userBalance }: MarketCardProps) {
  const [analysis, setAnalysis] = useState<string | null>(market.ai_analysis || null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!apiBaseUrl) return;
      try {
        const res = await fetch(`${apiBaseUrl}/markets/${market.id}/history`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("History fetch error:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [market.id]);

  const handleFetchAnalysis = async () => {
    if (analysis || !apiBaseUrl) return;
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/markets/${market.id}/analysis`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch analysis');
      setAnalysis(data.analysis);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAnalysisError(err.message);
      } else {
        setAnalysisError('An unknown error occurred.');
      }
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 transition-all hover:border-gray-500 flex flex-col">
        <div className="block p-4 cursor-pointer" onClick={() => onOpenTradeModal(market)}>
            {renderContent(market.content)}
        </div>

        <div className="px-4 py-3 border-y border-gray-700 flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
                <div>
                    <div className="text-xs text-gray-400">Price</div>
                    <div className="font-semibold text-white">$1.00</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400">Total Supply</div>
                    <div className="font-semibold text-white">{market.supply.toLocaleString()}</div>
                </div>
            </div>
            <div className="w-1/3 h-10">
                {isLoadingHistory ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
                ) : (
                  <SparklineChart data={history} />
                )}
            </div>
        </div>

        {(isLoadingAnalysis || analysis || analysisError) && (
            <div className="px-4 pt-4">
                <div className="p-3 rounded-md bg-gray-900/50 border border-gray-700 text-sm">
                    {isLoadingAnalysis && <p className="text-gray-400">🧠 Generating AI analysis...</p>}
                    {analysisError && <p className="text-red-400">Error: {analysisError}</p>}
                    {analysis && <p className="text-blue-300 break-words">{analysis}</p>}
                </div>
            </div>
        )}

        <div className="px-4 py-3 flex flex-wrap justify-between items-center gap-x-4 gap-y-2 text-xs">
            <div className='text-gray-500 break-all'>
              <span>Minted by {market.creator.slice(0, 6)}...{market.creator.slice(-4)}</span>
              {userBalance !== undefined && userBalance > 0 && (
                <>
                  <span className="mx-2">|</span>
                  <span className="font-bold text-blue-400">Your Shares: {userBalance.toLocaleString()}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleFetchAnalysis}
                    disabled={isLoadingAnalysis || !!analysis}
                    className="px-3 py-1 rounded-md bg-blue-600/50 text-blue-300 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
                >
                    {analysis ? 'Analyzed' : 'Analyze'}
                </button>
                <button
                    onClick={() => onOpenTradeModal(market)}
                    className="px-3 py-1 rounded-md bg-blue-600/50 text-blue-300 hover:bg-blue-600/80 text-xs font-semibold"
                >
                    Trade
                </button>
            </div>
        </div>
    </div>
  );
}

interface ActivityFeedProps {
    markets?: Market[];
    previewMarket?: Market | null;
    onOpenTradeModal?: (market: Market) => void;
    feedType?: 'Top' | 'Live';
}

export default function ActivityFeed({ markets = [], previewMarket, onOpenTradeModal = () => {}, feedType = 'Top' }: ActivityFeedProps) {
  if (previewMarket) {
    return (
        <div className="rounded-lg border-2 border-blue-500 bg-gray-800/50">
            <div className="p-4">{renderContent(previewMarket.content)}</div>
            <div className="border-t border-blue-500 px-4 py-2 flex justify-between items-center text-xs text-blue-400">
                <span>Minting as {previewMarket.creator.slice(0, 6)}...</span>
                <span>Supply: {previewMarket.supply.toLocaleString()}</span>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{feedType} Markets</h2>
        {feedType === 'Live' && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </span>
        )}
      </div>
      <div className="space-y-4">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            onOpenTradeModal={onOpenTradeModal}
          />
        ))}
        {markets.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-700 text-center py-12">
             <p className="text-gray-500">{feedType === 'Live' ? 'The feed is empty. Mint a link to get started.' : 'No top markets to display yet.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}