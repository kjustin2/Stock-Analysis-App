import { Router } from 'express';
import { GameController } from '../controllers/game.controller';

const router = Router();
const gameController = new GameController();

// Game state management
router.post('/start', gameController.startGame);
router.get('/state/:gameId', gameController.getGameState);
router.post('/save/:gameId', gameController.saveGame);
router.post('/load/:gameId', gameController.loadGame);

// Pharmacy management
router.post('/pharmacy/:gameId/set-prices', gameController.setMedicationPrices);
router.post('/pharmacy/:gameId/purchase-inventory', gameController.purchaseInventory);
router.post('/pharmacy/:gameId/upgrade', gameController.purchaseUpgrade);

// Market information
router.get('/market/prices', gameController.getMarketPrices);
router.get('/market/competitors/:gameId', gameController.getCompetitorInfo);

export default router; 