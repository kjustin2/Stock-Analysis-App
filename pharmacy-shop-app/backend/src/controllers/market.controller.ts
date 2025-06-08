import { Request, Response } from 'express';
import { MarketService } from '../services/market.service';
import { logger } from '../utils/logger';

export class MarketController {
  private marketService: MarketService;

  constructor() {
    this.marketService = new MarketService();
  }

  async getMarketPrices(req: Request, res: Response) {
    try {
      const prices = await this.marketService.getMarketPrices();
      res.status(200).json(prices);
    } catch (error) {
      logger.error('Error in getMarketPrices:', error);
      res.status(500).json({ error: 'Failed to get market prices' });
    }
  }

  async getMarketTrends(req: Request, res: Response) {
    try {
      const trends = await this.marketService.getMarketTrends();
      res.status(200).json(trends);
    } catch (error) {
      logger.error('Error in getMarketTrends:', error);
      res.status(500).json({ error: 'Failed to get market trends' });
    }
  }

  async getCompetitorPrices(req: Request, res: Response) {
    try {
      const prices = await this.marketService.getCompetitorPrices();
      res.status(200).json(prices);
    } catch (error) {
      logger.error('Error in getCompetitorPrices:', error);
      res.status(500).json({ error: 'Failed to get competitor prices' });
    }
  }

  async generateMarketEvent(req: Request, res: Response) {
    try {
      const event = await this.marketService.generateMarketEvent();
      res.status(201).json(event);
    } catch (error) {
      logger.error('Error in generateMarketEvent:', error);
      res.status(500).json({ error: 'Failed to generate market event' });
    }
  }

  async getMedicationInfo(req: Request, res: Response) {
    try {
      const { medicationId } = req.params;
      const info = await this.marketService.getMedicationInfo(medicationId);
      res.status(200).json(info);
    } catch (error) {
      logger.error('Error in getMedicationInfo:', error);
      res.status(500).json({ error: 'Failed to get medication info' });
    }
  }
} 