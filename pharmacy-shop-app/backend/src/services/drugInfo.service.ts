import axios from 'axios';
import { logger } from '../utils/logger';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

export interface DrugInfo {
  rxcui: string;
  name: string;
  synonym?: string;
  tty: string;
  language: string;
  suppress: string;
  umlscui: string;
}

export interface DrugInteraction {
  interactionPair: {
    interactionConcept: Array<{
      minConceptItem: {
        rxcui: string;
        name: string;
        tty: string;
      };
    }>;
    severity: string;
    description: string;
  }[];
}

export class DrugInfoService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private async fetchWithCache(url: string): Promise<any> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get(url);
      this.cache.set(url, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error) {
      logger.error('Error fetching from RxNorm API:', error);
      throw error;
    }
  }

  async searchDrug(name: string): Promise<DrugInfo[]> {
    try {
      const url = `${RXNORM_BASE_URL}/drugs.json?name=${encodeURIComponent(name)}`;
      const response = await this.fetchWithCache(url);
      return response.drugGroup?.conceptGroup
        ?.flatMap((group: any) => group.conceptProperties || [])
        .filter(Boolean) || [];
    } catch (error) {
      logger.error('Error searching drug:', error);
      return [];
    }
  }

  async getDrugDetails(rxcui: string): Promise<any> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/allrelated.json`;
      const response = await this.fetchWithCache(url);
      return response.allRelatedGroup?.conceptGroup || [];
    } catch (error) {
      logger.error('Error getting drug details:', error);
      return [];
    }
  }

  async getInteractions(rxcuis: string[]): Promise<DrugInteraction[]> {
    try {
      const url = `${RXNORM_BASE_URL}/interaction/list.json?rxcuis=${rxcuis.join('+')}`;
      const response = await this.fetchWithCache(url);
      return response.fullInteractionTypeGroup?.[0]?.fullInteractionType || [];
    } catch (error) {
      logger.error('Error getting drug interactions:', error);
      return [];
    }
  }

  async getGenericAlternatives(rxcui: string): Promise<DrugInfo[]> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=SCD+SCDG`;
      const response = await this.fetchWithCache(url);
      return response.relatedGroup?.conceptGroup
        ?.flatMap((group: any) => group.conceptProperties || [])
        .filter(Boolean) || [];
    } catch (error) {
      logger.error('Error getting generic alternatives:', error);
      return [];
    }
  }

  async getDrugStrengths(rxcui: string): Promise<any[]> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=SCDC+SCDF`;
      const response = await this.fetchWithCache(url);
      return response.relatedGroup?.conceptGroup
        ?.flatMap((group: any) => group.conceptProperties || [])
        .filter(Boolean) || [];
    } catch (error) {
      logger.error('Error getting drug strengths:', error);
      return [];
    }
  }

  async getDrugForms(rxcui: string): Promise<any[]> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=DF`;
      const response = await this.fetchWithCache(url);
      return response.relatedGroup?.conceptGroup
        ?.flatMap((group: any) => group.conceptProperties || [])
        .filter(Boolean) || [];
    } catch (error) {
      logger.error('Error getting drug forms:', error);
      return [];
    }
  }

  async getDrugPackaging(rxcui: string): Promise<any[]> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=GPCK+BPK`;
      const response = await this.fetchWithCache(url);
      return response.relatedGroup?.conceptGroup
        ?.flatMap((group: any) => group.conceptProperties || [])
        .filter(Boolean) || [];
    } catch (error) {
      logger.error('Error getting drug packaging:', error);
      return [];
    }
  }
} 