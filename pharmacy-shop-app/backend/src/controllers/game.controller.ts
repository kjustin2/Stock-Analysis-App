import { Request, Response } from 'express';
import { GameService } from '../services/game.service';
import { logger } from '../utils/logger';

export class GameController {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  startGame = async (req: Request, res: Response) => {
    try {
      const gameState = await this.gameService.startNewGame();
      res.status(201).json(gameState);
    } catch (error) {
      logger.error('Error starting game:', error);
      res.status(500).json({ error: 'Failed to start game' });
    }
  };

  getGameState = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const gameState = await this.gameService.getGameState(gameId);
      res.json(gameState);
    } catch (error) {
      logger.error('Error getting game state:', error);
      res.status(500).json({ error: 'Failed to get game state' });
    }
  };

  saveGame = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      await this.gameService.saveGame(gameId);
      res.json({ message: 'Game saved successfully' });
    } catch (error) {
      logger.error('Error saving game:', error);
      res.status(500).json({ error: 'Failed to save game' });
    }
  };

  loadGame = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const gameState = await this.gameService.loadGame(gameId);
      res.json(gameState);
    } catch (error) {
      logger.error('Error loading game:', error);
      res.status(500).json({ error: 'Failed to load game' });
    }
  };

  setMedicationPrices = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const { prices } = req.body;
      await this.gameService.setMedicationPrices(gameId, prices);
      res.json({ message: 'Prices updated successfully' });
    } catch (error) {
      logger.error('Error setting medication prices:', error);
      res.status(500).json({ error: 'Failed to set medication prices' });
    }
  };

  purchaseInventory = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const { items } = req.body;
      const result = await this.gameService.purchaseInventory(gameId, items);
      res.json(result);
    } catch (error) {
      logger.error('Error purchasing inventory:', error);
      res.status(500).json({ error: 'Failed to purchase inventory' });
    }
  };

  purchaseUpgrade = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const { upgradeId } = req.body;
      const result = await this.gameService.purchaseUpgrade(gameId, upgradeId);
      res.json(result);
    } catch (error) {
      logger.error('Error purchasing upgrade:', error);
      res.status(500).json({ error: 'Failed to purchase upgrade' });
    }
  };

  getMarketPrices = async (req: Request, res: Response) => {
    try {
      const prices = await this.gameService.getMarketPrices();
      res.json(prices);
    } catch (error) {
      logger.error('Error getting market prices:', error);
      res.status(500).json({ error: 'Failed to get market prices' });
    }
  };

  getCompetitorInfo = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const competitors = await this.gameService.getCompetitorInfo(gameId);
      res.json(competitors);
    } catch (error) {
      logger.error('Error getting competitor info:', error);
      res.status(500).json({ error: 'Failed to get competitor info' });
    }
  };
} 