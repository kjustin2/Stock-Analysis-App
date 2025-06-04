import { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { StockAnalysis, NewsArticle } from '../services/api';
import { api } from '../services/api';

const Panel = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5rem;
`;

const Indicator = styled.div`
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const IndicatorRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.span`
  font-weight: 600;
  color: #666;
  min-width: 100px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  cursor: help;
  position: relative;
  margin-left: 4px;

  &:hover {
    background: #bbdefb;
  }
`;

const Tooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 14px;
  background: #333;
  color: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: normal;
  white-space: normal;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 1000;
  width: 220px;
  line-height: 1.4;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const indicatorDescriptions = {
  rsi: "RSI measures price momentum from 0-100. Above 70 is overbought (potential sell), below 30 is oversold (potential buy).",
  macd: "MACD compares short and long-term price trends. When MACD crosses above signal line = bullish, below = bearish.",
  sma50: "50-day moving average price. Used to identify medium-term trends and support/resistance levels.",
  sma200: "200-day moving average price. Key indicator for long-term trends and major support/resistance levels.",
  signal: "Combined analysis of multiple technical indicators suggesting the current market action.",
  trend: "Overall price direction based on the relationship between current price and moving averages.",
  histogram: "Shows MACD momentum. Larger bars = stronger trend, color indicates direction.",
  signalLine: "9-day average of MACD. Crossovers with MACD line generate trading signals.",
};

interface InfoTooltipProps {
  description: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ description }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InfoIcon
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      i
      <Tooltip visible={isVisible}>
        {description}
      </Tooltip>
    </InfoIcon>
  );
};

const SignalIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;

const SignalBadge = styled.span<{ $signal: string }>`
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  background: ${props => {
    switch (props.$signal) {
      case 'Strong Buy':
        return '#e8f5e9';
      case 'Buy':
        return '#f1f8e9';
      case 'Hold':
        return '#fff3e0';
      case 'Sell':
        return '#ffebee';
      case 'Strong Sell':
        return '#ffcdd2';
      default:
        return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$signal) {
      case 'Strong Buy':
        return '#1b5e20';
      case 'Buy':
        return '#2e7d32';
      case 'Hold':
        return '#f57c00';
      case 'Sell':
        return '#c62828';
      case 'Strong Sell':
        return '#b71c1c';
      default:
        return '#333';
    }
  }};
`;

const TrendIndicator = styled.div<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  background: ${props => {
    switch (props.$trend) {
      case 'up':
        return '#e8f5e9';
      case 'down':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$trend) {
      case 'up':
        return '#1b5e20';
      case 'down':
        return '#c62828';
      default:
        return '#666';
    }
  }};
`;

const Value = styled.span<{ $value?: number }>`
  color: ${props => {
    if (typeof props.$value === 'number') {
      return props.$value > 70 ? '#c62828' : props.$value < 30 ? '#2e7d32' : '#333';
    }
    return '#333';
  }};
  font-weight: ${props => typeof props.$value === 'number' ? '600' : 'normal'};
`;

const PriceChange = styled.span<{ $isPositive: boolean }>`
  color: ${props => props.$isPositive ? '#2e7d32' : '#c62828'};
  font-weight: 600;
  margin-left: 8px;
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.8);
`;

const NewsSection = styled.div`
  margin-top: 20px;
`;

const NewsTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.2rem;
`;

const NewsCard = styled.a`
  display: block;
  padding: 12px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;

  &:hover {
    background: #e9ecef;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const NewsHeadline = styled.h4`
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 1rem;
`;

const NewsMetadata = styled.div`
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
`;

const NewsSummary = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #444;
  line-height: 1.4;
`;

interface AnalysisPanelProps {
  analysis: StockAnalysis;
  isLoading?: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isLoading }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      if (analysis.symbol) {
        setIsLoadingNews(true);
        try {
          const newsData = await api.getStockNews(analysis.symbol);
          console.log('Fetched news data:', newsData);
          setNews(newsData);
        } catch (error) {
          console.error('Error fetching news:', error);
        } finally {
          setIsLoadingNews(false);
        }
      }
    };

    fetchNews();
  }, [analysis.symbol]);

  const getTrend = () => {
    if (analysis.current_price > analysis.sma_50 && analysis.sma_50 > analysis.sma_200) {
      return 'up';
    } else if (analysis.current_price < analysis.sma_50 && analysis.sma_50 < analysis.sma_200) {
      return 'down';
    }
    return 'neutral';
  };

  const getSignalDescription = (signal: string) => {
    switch (signal) {
      case 'Strong Buy':
        return 'Multiple indicators align for a strong bullish signal: RSI shows oversold conditions, MACD indicates strong upward momentum, and price is above both moving averages with increasing spread.';
      case 'Buy':
        return 'Positive indicators suggest an upward trend: Price above key moving averages, RSI in favorable range, and MACD showing positive momentum.';
      case 'Hold':
        return 'Mixed signals present: Some indicators positive while others negative. Consider current position and risk tolerance before trading.';
      case 'Sell':
        return 'Negative indicators suggest a downward trend: Price below key moving averages, RSI in higher range, and MACD showing negative momentum.';
      case 'Strong Sell':
        return 'Multiple indicators align for a strong bearish signal: RSI shows overbought conditions, MACD indicates strong downward momentum, and price is below both moving averages with increasing spread.';
      default:
        return '';
    }
  };

  const trend = getTrend();
  const priceVsSMA50 = ((analysis.current_price - analysis.sma_50) / analysis.sma_50 * 100).toFixed(2);
  const sma50VsSMA200 = ((analysis.sma_50 - analysis.sma_200) / analysis.sma_200 * 100).toFixed(2);

  if (isLoading) {
    return (
      <Panel>
        <LoadingOverlay>Loading analysis...</LoadingOverlay>
      </Panel>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Panel>
        <Title>{analysis.symbol} Analysis</Title>
        
        <Indicator>
          <IndicatorRow>
            <Label>Current Price:</Label>
            <Value>${analysis.current_price.toFixed(2)}</Value>
            <PriceChange $isPositive={analysis.current_price > analysis.sma_50}>
              ({analysis.current_price > analysis.sma_50 ? '+' : ''}{priceVsSMA50}% vs SMA50)
            </PriceChange>
          </IndicatorRow>
        </Indicator>

        <Indicator>
          <SignalIndicator>
            <Label>
              Signal <InfoTooltip description={indicatorDescriptions.signal} />
            </Label>
            <SignalBadge $signal={analysis.signal}>{analysis.signal}</SignalBadge>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              {getSignalDescription(analysis.signal)}
            </span>
          </SignalIndicator>
        </Indicator>

        <Indicator>
          <IndicatorRow>
            <Label>
              Trend <InfoTooltip description={indicatorDescriptions.trend} />
            </Label>
            <TrendIndicator $trend={trend}>
              {trend === 'up' ? '↗ Upward' : trend === 'down' ? '↘ Downward' : '→ Sideways'}
            </TrendIndicator>
          </IndicatorRow>
        </Indicator>

        <Indicator>
          <IndicatorRow>
            <Label>
              RSI (14) <InfoTooltip description={indicatorDescriptions.rsi} />
            </Label>
            <Value $value={analysis.rsi}>{analysis.rsi.toFixed(2)}</Value>
            <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>
              {analysis.rsi > 70 ? '(Overbought)' : analysis.rsi < 30 ? '(Oversold)' : '(Neutral)'}
            </span>
          </IndicatorRow>
        </Indicator>

        <Indicator>
          <IndicatorRow>
            <Label>
              MACD <InfoTooltip description={indicatorDescriptions.macd} />
            </Label>
            <Value>{analysis.macd.macd.toFixed(2)}</Value>
          </IndicatorRow>
          <IndicatorRow>
            <Label>
              Signal Line <InfoTooltip description={indicatorDescriptions.signalLine} />
            </Label>
            <Value>{analysis.macd.signal.toFixed(2)}</Value>
          </IndicatorRow>
          <IndicatorRow>
            <Label>
              Histogram <InfoTooltip description={indicatorDescriptions.histogram} />
            </Label>
            <Value style={{ color: analysis.macd.histogram > 0 ? '#2e7d32' : '#c62828' }}>
              {analysis.macd.histogram.toFixed(2)}
            </Value>
          </IndicatorRow>
        </Indicator>

        <Indicator>
          <IndicatorRow>
            <Label>
              SMA 50 <InfoTooltip description={indicatorDescriptions.sma50} />
            </Label>
            <Value>${analysis.sma_50.toFixed(2)}</Value>
            <PriceChange $isPositive={analysis.sma_50 > analysis.sma_200}>
              ({analysis.sma_50 > analysis.sma_200 ? '+' : ''}{sma50VsSMA200}% vs SMA200)
            </PriceChange>
          </IndicatorRow>
        </Indicator>

        <Indicator>
          <IndicatorRow>
            <Label>
              SMA 200 <InfoTooltip description={indicatorDescriptions.sma200} />
            </Label>
            <Value>${analysis.sma_200.toFixed(2)}</Value>
          </IndicatorRow>
        </Indicator>
      </Panel>

      <Panel>
        <NewsTitle>Latest News</NewsTitle>
        {isLoadingNews ? (
          <LoadingOverlay>Loading news...</LoadingOverlay>
        ) : news && news.length > 0 ? (
          <NewsSection>
            {news.slice(0, 3).map((article, index) => (
              <NewsCard key={index} href={article.url} target="_blank" rel="noopener noreferrer">
                <NewsHeadline>{article.title}</NewsHeadline>
                <NewsMetadata>
                  <span>{article.source}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </NewsMetadata>
                <NewsSummary>{article.summary}</NewsSummary>
              </NewsCard>
            ))}
          </NewsSection>
        ) : (
          <div>No recent news available for {analysis.symbol}</div>
        )}
      </Panel>
    </div>
  );
}; 