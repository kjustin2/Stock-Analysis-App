import axios from 'axios';

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  published: string;
  source: string;
}

export interface NewsResponse {
  symbol: string;
  news: NewsItem[];
}

export class NewsService {
  private static instance: NewsService;
  private cache: Map<string, { data: NewsResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly finnhubApiKey: string;

  private readonly PROXY_URL = 'https://api.allorigins.win/get?url=';
  private readonly FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

  constructor() {
    this.finnhubApiKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private getCachedData(key: string): NewsResponse | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private setCachedData(key: string, data: NewsResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getStockNews(symbol: string): Promise<NewsResponse> {
    const cacheKey = `news_${symbol}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey)!;
    }

    let news: NewsItem[] = [];

    // Try Finnhub company news first (if API key available)
    if (this.finnhubApiKey) {
      try {
        news = await this.fetchNewsFromFinnhub(symbol);
        if (news.length > 0) {
          console.log(`✅ Real news fetched from Finnhub for ${symbol}: ${news.length} articles`);
        }
      } catch (error) {
        console.warn('Finnhub news fetch failed, falling back to RSS feeds:', error);
      }
    }

    // If no news from Finnhub, try RSS feeds
    if (news.length === 0) {
      try {
        const companyName = this.getCompanyName(symbol);
        news = await this.fetchRealNewsFromRSS(companyName, symbol);
        if (news.length > 0) {
          console.log(`✅ Real news fetched from RSS feeds for ${symbol}: ${news.length} articles`);
        }
      } catch (error) {
        console.warn('RSS news fetch failed:', error);
      }
    }

    const newsResponse: NewsResponse = {
      symbol: symbol.toUpperCase(),
      news: news
    };

    this.setCachedData(cacheKey, newsResponse);
    return newsResponse;
  }

  private async fetchNewsFromFinnhub(symbol: string): Promise<NewsItem[]> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const fromDate = lastWeek.toISOString().split('T')[0];
    const toDate = now.toISOString().split('T')[0];

    const response = await axios.get(`${this.FINNHUB_BASE_URL}/company-news`, {
      params: {
        symbol: symbol.toUpperCase(),
        from: fromDate,
        to: toDate,
        token: this.finnhubApiKey
      },
      timeout: 5000 // Faster timeout for Finnhub
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid news response from Finnhub');
    }

    const newsItems: NewsItem[] = response.data
      .filter((item: any) => item.headline && item.url && item.datetime)
      .slice(0, 5) // Limit to 5 articles
      .map((item: any) => ({
        headline: item.headline,
        summary: item.summary || this.truncateText(item.headline, 150),
        url: item.url,
        published: new Date(item.datetime * 1000).toISOString(),
        source: this.extractSourceFromUrl(item.url) || 'Finnhub'
      }));

    return newsItems;
  }

  private async fetchRealNewsFromRSS(companyName: string, symbol: string): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];

    // Reduced timeout for faster performance - 3 seconds max per source
    const FAST_TIMEOUT = 3000;

    // Only try Yahoo Finance RSS (most likely to have stock-specific news)
    try {
      const yahooRssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
      const response = await axios.get(`${this.PROXY_URL}${encodeURIComponent(yahooRssUrl)}`, {
        timeout: FAST_TIMEOUT
      });

      if (response.data && response.data.contents) {
        const items = this.parseYahooRSS(response.data.contents, symbol);
        newsItems.push(...items.slice(0, 5)); // Get more from the most relevant source
      }
    } catch (error) {
      console.warn('Yahoo Finance RSS failed (fast timeout):', error);
    }

    // If no Yahoo RSS news, try one general financial feed with fast timeout
    if (newsItems.length === 0) {
      try {
        const marketWatchUrl = 'https://feeds.marketwatch.com/marketwatch/topstories/';
        const response = await axios.get(`${this.PROXY_URL}${encodeURIComponent(marketWatchUrl)}`, {
          timeout: FAST_TIMEOUT
        });

        if (response.data && response.data.contents) {
          const items = this.parseGenericRSS(response.data.contents, 'MarketWatch');
          // Filter for relevance or just take top general news
          const relevantItems = items.filter(item => 
            item.headline.toLowerCase().includes(symbol.toLowerCase()) ||
            item.headline.toLowerCase().includes(companyName.toLowerCase())
          );
          
          if (relevantItems.length > 0) {
            newsItems.push(...relevantItems.slice(0, 3));
          } else {
            // Take general financial news if no specific match
            newsItems.push(...items.slice(0, 3));
          }
        }
      } catch (error) {
        console.warn('MarketWatch RSS failed (fast timeout):', error);
      }
    }

    return newsItems.slice(0, 5);
  }

  private parseYahooRSS(rssContent: string, _symbol: string): NewsItem[] {
    const items: NewsItem[] = [];
    
    try {
      const itemMatches = rssContent.match(/<item[^>]*>[\s\S]*?<\/item>/g);
      
      if (itemMatches) {
        for (const item of itemMatches.slice(0, 5)) {
          const title = this.extractRSSField(item, 'title');
          const description = this.extractRSSField(item, 'description');
          const link = this.extractRSSField(item, 'link');
          const pubDate = this.extractRSSField(item, 'pubDate');
          
          if (title && link) {
            items.push({
              headline: this.cleanHtml(title),
              summary: this.cleanHtml(description || 'Yahoo Finance news update'),
              url: link.trim(),
              published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              source: 'Yahoo Finance'
            });
          }
        }
      }
    } catch (error) {
      console.warn('Yahoo RSS parsing failed:', error);
    }
    
    return items;
  }

  private parseGenericRSS(rssContent: string, source: string): NewsItem[] {
    const items: NewsItem[] = [];
    
    try {
      const itemMatches = rssContent.match(/<item[^>]*>[\s\S]*?<\/item>/g);
      
      if (itemMatches) {
        for (const item of itemMatches.slice(0, 3)) {
          const title = this.extractRSSField(item, 'title');
          const description = this.extractRSSField(item, 'description');
          const link = this.extractRSSField(item, 'link');
          const pubDate = this.extractRSSField(item, 'pubDate');
          
          if (title && link) {
            items.push({
              headline: this.cleanHtml(title),
              summary: this.cleanHtml(description || 'Financial news update'),
              url: link.trim(),
              published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              source: source
            });
          }
        }
      }
    } catch (error) {
      console.warn(`${source} RSS parsing failed:`, error);
    }
    
    return items;
  }

  private extractRSSField(item: string, field: string): string | null {
    const regex = new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, 'i');
    const match = item.match(regex);
    return match ? match[1] : null;
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, '')
      .trim();
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private extractSourceFromUrl(url: string): string | null {
    try {
      const domain = new URL(url).hostname;
      const sourceMap: Record<string, string> = {
        'reuters.com': 'Reuters',
        'bloomberg.com': 'Bloomberg',
        'marketwatch.com': 'MarketWatch',
        'wsj.com': 'Wall Street Journal',
        'finance.yahoo.com': 'Yahoo Finance',
        'seekingalpha.com': 'Seeking Alpha',
        'fool.com': 'The Motley Fool',
        'cnbc.com': 'CNBC',
        'investorplace.com': 'InvestorPlace'
      };
      
      for (const [key, value] of Object.entries(sourceMap)) {
        if (domain.includes(key)) {
          return value;
        }
      }
      
      return domain;
    } catch {
      return null;
    }
  }

  private getCompanyName(symbol: string): string {
    const companyMap: Record<string, string> = {
      'AAPL': 'Apple',
      'GOOGL': 'Google',
      'MSFT': 'Microsoft',
      'AMZN': 'Amazon',
      'TSLA': 'Tesla',
      'NVDA': 'NVIDIA',
      'META': 'Meta',
      'NFLX': 'Netflix',
      'ORCL': 'Oracle',
      'CRM': 'Salesforce',
      'INTC': 'Intel',
      'AMD': 'AMD',
      'PYPL': 'PayPal',
      'ADBE': 'Adobe',
      'UBER': 'Uber',
      'SPOT': 'Spotify',
      'ZOOM': 'Zoom',
      'SQ': 'Block',
      'SHOP': 'Shopify',
      'COIN': 'Coinbase'
    };
    return companyMap[symbol.toUpperCase()] || symbol;
  }
}

export const newsService = NewsService.getInstance(); 