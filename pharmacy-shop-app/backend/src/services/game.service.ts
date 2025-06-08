import { MarketService } from './market.service';
import { logger } from '../utils/logger';
import { db } from '../database';

export interface GameStateData {
  id: string;
  money: number;
  reputation: number;
  customer_satisfaction: number;
  day: number;
  inventory: any[];
  competitors: any[];
  daily_stats: any[];
}

export class GameService {
  private marketService: MarketService;

  constructor() {
    this.marketService = new MarketService();
  }

  async startNewGame(): Promise<GameStateData> {
    try {
      const gameId = await db.createNewGame();
      const gameState = await this.getGameState(gameId);
      return gameState;
    } catch (error) {
      logger.error('Error starting new game:', error);
      throw error;
    }
  }

  async getGameState(gameId: string): Promise<GameStateData> {
    try {
      // Get basic game state
      const gameState = await db.get<any>(
        'SELECT * FROM game_state WHERE id = ?',
        [gameId]
      );

      if (!gameState) {
        throw new Error('Game not found');
      }

      // Get inventory
      const inventory = await db.all<any>(
        `SELECT i.*, m.name as medication_name, m.generic_name, m.category
         FROM inventory i
         JOIN medications m ON i.medication_id = m.id
         WHERE i.game_id = ?`,
        [gameId]
      );

      // Get competitors
      const competitors = await db.all<any>(
        'SELECT * FROM competitors WHERE game_id = ?',
        [gameId]
      );

      // Get daily stats
      const dailyStats = await db.all<any>(
        'SELECT * FROM daily_stats WHERE game_id = ? ORDER BY day DESC LIMIT 30',
        [gameId]
      );

      return {
        id: gameState.id,
        money: gameState.money,
        reputation: gameState.reputation,
        customer_satisfaction: gameState.customer_satisfaction,
        day: gameState.day,
        inventory,
        competitors,
        daily_stats: dailyStats
      };
    } catch (error) {
      logger.error('Error getting game state:', error);
      throw error;
    }
  }

  async saveGame(gameId: string): Promise<void> {
    try {
      // Update timestamp
      await db.run(
        'UPDATE game_state SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [gameId]
      );
    } catch (error) {
      logger.error('Error saving game:', error);
      throw error;
    }
  }

  async loadGame(gameId: string): Promise<GameStateData> {
    try {
      return await this.getGameState(gameId);
    } catch (error) {
      logger.error('Error loading game:', error);
      throw error;
    }
  }

  async setMedicationPrices(gameId: string, prices: { [key: string]: number }): Promise<void> {
    try {
      for (const [itemId, price] of Object.entries(prices)) {
        await db.run(
          'UPDATE inventory SET price = ? WHERE id = ? AND game_id = ?',
          [price, itemId, gameId]
        );
      }
    } catch (error) {
      logger.error('Error setting medication prices:', error);
      throw error;
    }
  }

  async purchaseInventory(gameId: string, items: Array<{ id: string, quantity: number }>): Promise<GameStateData> {
    try {
      const gameState = await db.get<any>('SELECT * FROM game_state WHERE id = ?', [gameId]);
      if (!gameState) {
        throw new Error('Game not found');
      }

      const marketPrices = await this.marketService.getMarketPrices();
      let totalCost = 0;

      // Calculate total cost
      for (const item of items) {
        const medication = await db.get<any>('SELECT * FROM medications WHERE id = ?', [item.id]);
        if (!medication) {
          throw new Error(`Invalid medication ID: ${item.id}`);
        }
        totalCost += medication.base_price * item.quantity;
      }

      if (totalCost > gameState.money) {
        throw new Error('Insufficient funds');
      }

      // Update inventory and cash
      for (const item of items) {
        const existingItem = await db.get<any>(
          'SELECT * FROM inventory WHERE game_id = ? AND medication_id = ?',
          [gameId, item.id]
        );

        if (existingItem) {
          await db.run(
            'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, existingItem.id]
          );
        } else {
          const medication = await db.get<any>('SELECT * FROM medications WHERE id = ?', [item.id]);
          const inventoryId = 'inv_' + Math.random().toString(36).substr(2, 9);
          await db.run(
            'INSERT INTO inventory (id, game_id, medication_id, quantity, price, cost, reorder_point) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [inventoryId, gameId, item.id, item.quantity, medication.base_price * 1.5, medication.base_price, 10]
          );
        }
      }

      await db.run(
        'UPDATE game_state SET money = money - ? WHERE id = ?',
        [totalCost, gameId]
      );

      return await this.getGameState(gameId);
    } catch (error) {
      logger.error('Error purchasing inventory:', error);
      throw error;
    }
  }

  async purchaseUpgrade(gameId: string, upgradeId: string): Promise<GameStateData> {
    try {
      // Implement upgrade logic here
      return await this.getGameState(gameId);
    } catch (error) {
      logger.error('Error purchasing upgrade:', error);
      throw error;
    }
  }

  async getMarketPrices(): Promise<{ [key: string]: number }> {
    try {
      return await this.marketService.getMarketPrices();
    } catch (error) {
      logger.error('Error getting market prices:', error);
      throw error;
    }
  }

  async getCompetitorInfo(gameId: string): Promise<any[]> {
    try {
      const competitors = await db.all<any>(
        'SELECT * FROM competitors WHERE game_id = ?',
        [gameId]
      );

      // Get competitor prices for each competitor
      for (const competitor of competitors) {
        const prices = await db.all<any>(
          'SELECT * FROM competitor_prices WHERE competitor_id = ?',
          [competitor.id]
        );
        competitor.prices = prices.reduce((acc: any, price: any) => {
          acc[price.medication] = price.price;
          return acc;
        }, {});
      }

      return competitors;
    } catch (error) {
      logger.error('Error getting competitor info:', error);
      throw error;
    }
  }
} 