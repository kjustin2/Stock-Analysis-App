import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';

const router = Router();
const marketController = new MarketController();

// Get current market prices
router.get(
  '/prices',
  marketController.getMarketPrices.bind(marketController)
);

// Get market trends
router.get(
  '/trends',
  marketController.getMarketTrends.bind(marketController)
);

// Get competitor prices
router.get(
  '/competitor-prices',
  marketController.getCompetitorPrices.bind(marketController)
);

// Generate market event
router.post(
  '/events',
  marketController.generateMarketEvent.bind(marketController)
);

// Get medication info
router.get(
  '/medications/:medicationId',
  marketController.getMedicationInfo.bind(marketController)
);

export default router; 