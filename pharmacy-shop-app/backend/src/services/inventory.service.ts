import { db } from '../database';
import { logger } from '../utils/logger';

export interface InventoryItem {
  id: string;
  game_id: string;
  medication_id: string;
  quantity: number;
  price: number;
  cost: number;
  reorder_point: number;
  expiry_date: string | null;
}

export class InventoryService {
  async addToInventory(gameId: string, item: Omit<InventoryItem, 'id' | 'game_id'>): Promise<string> {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await db.run(
        `INSERT INTO inventory (
          id, game_id, medication_id, quantity, price, 
          cost, reorder_point, expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          gameId,
          item.medication_id,
          item.quantity,
          item.price,
          item.cost,
          item.reorder_point,
          item.expiry_date
        ]
      );
      return id;
    } catch (error) {
      logger.error('Error adding to inventory:', error);
      throw error;
    }
  }

  async updateInventory(id: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = Object.values(updates);

      await db.run(
        `UPDATE inventory SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  async getInventory(gameId: string): Promise<InventoryItem[]> {
    try {
      const inventory = await db.all<any>(
        `SELECT i.*, m.name as medication_name, m.generic_name
         FROM inventory i
         JOIN medications m ON i.medication_id = m.id
         WHERE i.game_id = ?
         ORDER BY m.name ASC`,
        [gameId]
      );
      
      return inventory.map(item => ({
        id: item.id,
        game_id: item.game_id,
        medication_id: item.medication_id,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        reorder_point: item.reorder_point,
        expiry_date: item.expiry_date,
        medication_name: item.medication_name,
        generic_name: item.generic_name
      }));
    } catch (error) {
      logger.error('Error getting inventory:', error);
      return [];
    }
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    try {
      return await db.get<InventoryItem>(
        `SELECT i.*, m.name as medication_name, m.generic_name
         FROM inventory i
         JOIN medications m ON i.medication_id = m.id
         WHERE i.id = ?`,
        [id]
      );
    } catch (error) {
      logger.error('Error getting inventory item:', error);
      return undefined;
    }
  }

  async removeFromInventory(id: string): Promise<void> {
    try {
      await db.run('DELETE FROM inventory WHERE id = ?', [id]);
    } catch (error) {
      logger.error('Error removing from inventory:', error);
      throw error;
    }
  }

  async checkLowStock(gameId: string): Promise<InventoryItem[]> {
    try {
      return await db.all<InventoryItem>(
        `SELECT i.*, m.name as medication_name
         FROM inventory i
         JOIN medications m ON i.medication_id = m.id
         WHERE i.game_id = ? AND i.quantity <= i.reorder_point`,
        [gameId]
      );
    } catch (error) {
      logger.error('Error checking low stock:', error);
      return [];
    }
  }

  async checkExpiringSoon(gameId: string, daysThreshold: number): Promise<InventoryItem[]> {
    try {
      return await db.all<InventoryItem>(
        `SELECT i.*, m.name as medication_name
         FROM inventory i
         JOIN medications m ON i.medication_id = m.id
         WHERE i.game_id = ? 
         AND i.expiry_date IS NOT NULL
         AND date(i.expiry_date) <= date('now', '+' || ? || ' days')`,
        [gameId, daysThreshold]
      );
    } catch (error) {
      logger.error('Error checking expiring items:', error);
      return [];
    }
  }

  async adjustPrice(id: string, newPrice: number): Promise<void> {
    try {
      await this.updateInventory(id, { price: newPrice });
    } catch (error) {
      logger.error('Error adjusting price:', error);
      throw error;
    }
  }

  async restock(id: string, quantity: number, cost: number): Promise<void> {
    try {
      const item = await this.getInventoryItem(id);
      if (item) {
        await this.updateInventory(id, {
          quantity: item.quantity + quantity,
          cost: cost
        });
      }
    } catch (error) {
      logger.error('Error restocking inventory:', error);
      throw error;
    }
  }
} 