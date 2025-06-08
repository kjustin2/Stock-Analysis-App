import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { InventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  // Validation chains
  static validateAddToInventory = [
    body('medication_id').isString().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('price').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('reorder_point').isInt({ min: 0 }),
    body('expiry_date').optional().isISO8601(),
  ];

  static validateUpdateInventory = [
    param('id').isString().notEmpty(),
    body('quantity').optional().isInt({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('reorder_point').optional().isInt({ min: 0 }),
    body('expiry_date').optional().isISO8601(),
  ];

  async addToInventory(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gameId = req.params.gameId;
      const itemId = await this.inventoryService.addToInventory(gameId, req.body);
      
      res.status(201).json({ id: itemId });
    } catch (error) {
      logger.error('Error in addToInventory:', error);
      res.status(500).json({ error: 'Failed to add item to inventory' });
    }
  }

  async updateInventory(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      await this.inventoryService.updateInventory(id, req.body);
      
      res.status(200).json({ message: 'Inventory updated successfully' });
    } catch (error) {
      logger.error('Error in updateInventory:', error);
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  }

  async getInventory(req: Request, res: Response) {
    try {
      const gameId = req.params.gameId;
      const inventory = await this.inventoryService.getInventory(gameId);
      
      res.status(200).json(inventory);
    } catch (error) {
      logger.error('Error in getInventory:', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  }

  async getInventoryItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await this.inventoryService.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      
      res.status(200).json(item);
    } catch (error) {
      logger.error('Error in getInventoryItem:', error);
      res.status(500).json({ error: 'Failed to get inventory item' });
    }
  }

  async removeFromInventory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.inventoryService.removeFromInventory(id);
      
      res.status(200).json({ message: 'Item removed from inventory' });
    } catch (error) {
      logger.error('Error in removeFromInventory:', error);
      res.status(500).json({ error: 'Failed to remove item from inventory' });
    }
  }

  async checkLowStock(req: Request, res: Response) {
    try {
      const gameId = req.params.gameId;
      const lowStockItems = await this.inventoryService.checkLowStock(gameId);
      
      res.status(200).json(lowStockItems);
    } catch (error) {
      logger.error('Error in checkLowStock:', error);
      res.status(500).json({ error: 'Failed to check low stock' });
    }
  }

  async checkExpiringSoon(req: Request, res: Response) {
    try {
      const gameId = req.params.gameId;
      const daysThreshold = parseInt(req.query.days as string) || 30;
      const expiringItems = await this.inventoryService.checkExpiringSoon(gameId, daysThreshold);
      
      res.status(200).json(expiringItems);
    } catch (error) {
      logger.error('Error in checkExpiringSoon:', error);
      res.status(500).json({ error: 'Failed to check expiring items' });
    }
  }

  async adjustPrice(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { price } = req.body;
      
      await this.inventoryService.adjustPrice(id, price);
      
      res.status(200).json({ message: 'Price adjusted successfully' });
    } catch (error) {
      logger.error('Error in adjustPrice:', error);
      res.status(500).json({ error: 'Failed to adjust price' });
    }
  }

  async restock(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { quantity, cost } = req.body;
      
      await this.inventoryService.restock(id, quantity, cost);
      
      res.status(200).json({ message: 'Item restocked successfully' });
    } catch (error) {
      logger.error('Error in restock:', error);
      res.status(500).json({ error: 'Failed to restock item' });
    }
  }
} 