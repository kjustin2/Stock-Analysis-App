import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { body } from 'express-validator';

const router = Router();
const inventoryController = new InventoryController();

// Get all inventory items for a game
router.get(
  '/game/:gameId',
  inventoryController.getInventory.bind(inventoryController)
);

// Add item to inventory
router.post(
  '/game/:gameId',
  InventoryController.validateAddToInventory,
  inventoryController.addToInventory.bind(inventoryController)
);

// Get specific inventory item
router.get(
  '/:id',
  inventoryController.getInventoryItem.bind(inventoryController)
);

// Update inventory item
router.put(
  '/:id',
  InventoryController.validateUpdateInventory,
  inventoryController.updateInventory.bind(inventoryController)
);

// Remove item from inventory
router.delete(
  '/:id',
  inventoryController.removeFromInventory.bind(inventoryController)
);

// Check low stock items
router.get(
  '/game/:gameId/low-stock',
  inventoryController.checkLowStock.bind(inventoryController)
);

// Check expiring items
router.get(
  '/game/:gameId/expiring',
  inventoryController.checkExpiringSoon.bind(inventoryController)
);

// Adjust item price
router.patch(
  '/:id/price',
  body('price').isFloat({ min: 0 }),
  inventoryController.adjustPrice.bind(inventoryController)
);

// Restock item
router.post(
  '/:id/restock',
  [
    body('quantity').isInt({ min: 1 }),
    body('cost').isFloat({ min: 0 })
  ],
  inventoryController.restock.bind(inventoryController)
);

export default router; 