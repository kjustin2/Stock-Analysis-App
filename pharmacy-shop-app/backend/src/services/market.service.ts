import axios from 'axios';
import { logger } from '../utils/logger';

export interface MarketPrice {
  id: string;
  currentPrice: number;
  basePrice: number;
  lastUpdate: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
}

export interface MarketTrend {
  medicationId: string;
  shortTerm: 'increasing' | 'decreasing' | 'stable';
  longTerm: 'increasing' | 'decreasing' | 'stable';
  seasonalFactor: number;
  competitionFactor: number;
  demandFactor: number;
}

export interface Competitor {
  id: string;
  name: string;
  reputation: number;
  prices: { [medicationId: string]: number };
  specialties: string[];
  marketShare: number;
  strategy: 'premium' | 'discount' | 'balanced';
}

export interface MarketEvent {
  id: string;
  type: 'supply_chain' | 'price_change' | 'competitor_action' | 'seasonal' | 'trend';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedMedications: string[];
  impact: {
    priceChange: number;
    supplyChange: number;
    demandChange: number;
  };
  duration: number; // in days
  startDate: string;
}

export interface SeasonalEffect {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  medications: {
    [medicationId: string]: {
      demandMultiplier: number;
      priceMultiplier: number;
    };
  };
}

export class MarketService {
  private readonly FDA_API_KEY = process.env.FDA_API_KEY;
  private readonly GOODRX_API_KEY = process.env.GOODRX_API_KEY;
  private competitors: Competitor[] = [];
  private activeEvents: MarketEvent[] = [];
  private seasonalEffects: SeasonalEffect[] = [];

  constructor() {
    this.initializeCompetitors();
    this.initializeSeasonalEffects();
  }

  private initializeCompetitors() {
    this.competitors = [
      {
        id: 'comp1',
        name: 'HealthMart Pharmacy',
        reputation: 85,
        prices: {},
        specialties: ['generic', 'otc'],
        marketShare: 0.3,
        strategy: 'balanced'
      },
      {
        id: 'comp2',
        name: 'MediCare Plus',
        reputation: 90,
        prices: {},
        specialties: ['prescription', 'specialty'],
        marketShare: 0.25,
        strategy: 'premium'
      },
      {
        id: 'comp3',
        name: 'Discount Drugs',
        reputation: 70,
        prices: {},
        specialties: ['generic'],
        marketShare: 0.2,
        strategy: 'discount'
      }
    ];
  }

  private initializeSeasonalEffects() {
    this.seasonalEffects = [
      {
        season: 'winter',
        medications: {
          'cold_medicine': { demandMultiplier: 1.5, priceMultiplier: 1.2 },
          'flu_vaccine': { demandMultiplier: 2.0, priceMultiplier: 1.3 },
          'vitamin_c': { demandMultiplier: 1.4, priceMultiplier: 1.1 }
        }
      },
      {
        season: 'spring',
        medications: {
          'allergy_medicine': { demandMultiplier: 1.8, priceMultiplier: 1.3 },
          'antihistamine': { demandMultiplier: 1.6, priceMultiplier: 1.2 }
        }
      },
      {
        season: 'summer',
        medications: {
          'sunscreen': { demandMultiplier: 1.7, priceMultiplier: 1.2 },
          'insect_repellent': { demandMultiplier: 1.5, priceMultiplier: 1.1 }
        }
      },
      {
        season: 'fall',
        medications: {
          'flu_vaccine': { demandMultiplier: 1.6, priceMultiplier: 1.2 },
          'vitamin_d': { demandMultiplier: 1.3, priceMultiplier: 1.1 }
        }
      }
    ];
  }

  async getMarketPrices(): Promise<{ [key: string]: number }> {
    try {
      // Calculate current market prices based on base prices, events, and seasonal effects
      const baseMarketPrices = {
        'aspirin': 5.99,
        'ibuprofen': 7.99,
        'acetaminophen': 6.99,
        'amoxicillin': 15.99,
        'lisinopril': 12.99,
        'metformin': 10.99,
        'omeprazole': 18.99,
        'simvastatin': 25.99,
        'levothyroxine': 22.99,
        'amlodipine': 16.99
      };

      const currentSeason = this.getCurrentSeason();
      const seasonalEffect = this.seasonalEffects.find(effect => effect.season === currentSeason);
      const adjustedPrices: { [key: string]: number } = {};

      for (const [medicationId, basePrice] of Object.entries(baseMarketPrices)) {
        let adjustedPrice = basePrice;

        // Apply seasonal effects
        if (seasonalEffect?.medications[medicationId]) {
          adjustedPrice *= seasonalEffect.medications[medicationId].priceMultiplier;
        }

        // Apply active event effects
        for (const event of this.activeEvents) {
          if (event.affectedMedications.includes(medicationId)) {
            adjustedPrice *= (1 + event.impact.priceChange);
          }
        }

        adjustedPrices[medicationId] = Number(adjustedPrice.toFixed(2));
      }

      return adjustedPrices;
    } catch (error) {
      logger.error('Error calculating market prices:', error);
      throw error;
    }
  }

  async getMedicationInfo(medicationId: string): Promise<any> {
    try {
      // In a real implementation, this would make API calls to FDA API
      // For now, return mock data
      return {
        id: medicationId,
        name: 'Sample Medication',
        description: 'Sample medication description',
        sideEffects: ['Sample side effect 1', 'Sample side effect 2'],
        interactions: ['Sample interaction 1', 'Sample interaction 2']
      };
    } catch (error) {
      logger.error('Error fetching medication info:', error);
      throw error;
    }
  }

  async getMarketTrends(): Promise<{ [medicationId: string]: MarketTrend }> {
    try {
      const trends: { [medicationId: string]: MarketTrend } = {};
      const currentSeason = this.getCurrentSeason();
      const seasonalEffect = this.seasonalEffects.find(effect => effect.season === currentSeason);

      for (const medicationId of Object.keys(await this.getMarketPrices())) {
        const competitionFactor = this.calculateCompetitionFactor(medicationId);
        const seasonalFactor = seasonalEffect?.medications[medicationId]?.demandMultiplier || 1;
        const demandFactor = this.calculateDemandFactor(medicationId, seasonalFactor);

        trends[medicationId] = {
          medicationId,
          shortTerm: this.determineShortTermTrend(competitionFactor, seasonalFactor, demandFactor),
          longTerm: this.determineLongTermTrend(medicationId),
          seasonalFactor,
          competitionFactor,
          demandFactor
        };
      }

      return trends;
    } catch (error) {
      logger.error('Error calculating market trends:', error);
      throw error;
    }
  }

  async getCompetitorPrices(): Promise<{ [competitorId: string]: { [medicationId: string]: number } }> {
    try {
      const marketPrices = await this.getMarketPrices();
      const competitorPrices: { [competitorId: string]: { [medicationId: string]: number } } = {};

      for (const competitor of this.competitors) {
        competitorPrices[competitor.id] = {};
        for (const [medicationId, basePrice] of Object.entries(marketPrices)) {
          let price = basePrice;
          switch (competitor.strategy) {
            case 'premium':
              price *= 1.2;
              break;
            case 'discount':
              price *= 0.8;
              break;
            case 'balanced':
              price *= 1 + (Math.random() * 0.2 - 0.1); // ±10%
              break;
          }
          competitorPrices[competitor.id][medicationId] = Number(price.toFixed(2));
        }
      }

      return competitorPrices;
    } catch (error) {
      logger.error('Error calculating competitor prices:', error);
      throw error;
    }
  }

  async generateMarketEvent(): Promise<MarketEvent> {
    const eventTypes: MarketEvent['type'][] = ['supply_chain', 'price_change', 'competitor_action', 'seasonal', 'trend'];
    const severityLevels: MarketEvent['severity'][] = ['low', 'medium', 'high'];
    
    const event: MarketEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
      description: '',
      affectedMedications: [],
      impact: {
        priceChange: 0,
        supplyChange: 0,
        demandChange: 0
      },
      duration: 0,
      startDate: new Date().toISOString()
    };

    // Configure event based on type and severity
    switch (event.type) {
      case 'supply_chain':
        event.description = 'Supply chain disruption affecting medication availability';
        event.impact.supplyChange = -0.3;
        event.duration = 7;
        break;
      case 'price_change':
        event.description = 'Market price fluctuation due to economic factors';
        event.impact.priceChange = 0.2;
        event.duration = 14;
        break;
      case 'competitor_action':
        event.description = 'Competitor launched aggressive pricing strategy';
        event.impact.priceChange = -0.15;
        event.duration = 10;
        break;
      case 'seasonal':
        event.description = 'Seasonal demand increase';
        event.impact.demandChange = 0.25;
        event.duration = 30;
        break;
      case 'trend':
        event.description = 'New market trend affecting medication demand';
        event.impact.demandChange = 0.1;
        event.duration = 21;
        break;
    }

    // Adjust impact based on severity
    const severityMultiplier = event.severity === 'high' ? 2 : event.severity === 'medium' ? 1.5 : 1;
    event.impact.priceChange *= severityMultiplier;
    event.impact.supplyChange *= severityMultiplier;
    event.impact.demandChange *= severityMultiplier;

    // Select affected medications
    const marketPrices = await this.getMarketPrices();
    const allMedications = Object.keys(marketPrices);
    const numAffected = Math.floor(Math.random() * 3) + 1; // 1-3 medications affected
    event.affectedMedications = this.shuffleArray(allMedications).slice(0, numAffected);

    this.activeEvents.push(event);
    return event;
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private calculateCompetitionFactor(medicationId: string): number {
    // Calculate based on number of competitors and their prices
    return 1 + (Math.random() * 0.4 - 0.2); // ±20%
  }

  private calculateDemandFactor(medicationId: string, seasonalFactor: number): number {
    // Calculate based on seasonal effects and active events
    let factor = seasonalFactor;
    for (const event of this.activeEvents) {
      if (event.affectedMedications.includes(medicationId)) {
        factor *= (1 + event.impact.demandChange);
      }
    }
    return factor;
  }

  private determineShortTermTrend(
    competitionFactor: number,
    seasonalFactor: number,
    demandFactor: number
  ): MarketTrend['shortTerm'] {
    const trend = competitionFactor * seasonalFactor * demandFactor;
    if (trend > 1.1) return 'increasing';
    if (trend < 0.9) return 'decreasing';
    return 'stable';
  }

  private determineLongTermTrend(medicationId: string): MarketTrend['longTerm'] {
    // Simplified long-term trend determination
    const random = Math.random();
    if (random < 0.3) return 'increasing';
    if (random < 0.6) return 'decreasing';
    return 'stable';
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 