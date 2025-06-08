import axios from 'axios';

export interface InventoryItem {
  id: string;
  medication_id: string;
  medication_name: string;
  generic_name: string | null;
  quantity: number;
  price: number;
  cost: number;
  reorder_point: number;
  expiry_date: string | null;
  category?: string;
}

class InventoryService {
  private baseURL = 'http://localhost:3005/api';

  // Mock data for fallback - starts empty for new players
  private mockInventory: InventoryItem[] = [];

  // Available medications for purchase
  private availableMedications = [
    {
      id: 'med_001',
      name: 'Aspirin',
      generic_name: 'Acetylsalicylic acid',
      cost: 5.99,
      suggested_price: 8.99,
      category: 'Pain Relief',
      description: 'Pain reliever and fever reducer'
    },
    {
      id: 'med_002',
      name: 'Ibuprofen',
      generic_name: 'Ibuprofen',
      cost: 7.99,
      suggested_price: 11.99,
      category: 'Pain Relief',
      description: 'Anti-inflammatory pain reliever'
    },
    {
      id: 'med_003',
      name: 'Acetaminophen',
      generic_name: 'Paracetamol',
      cost: 6.49,
      suggested_price: 9.49,
      category: 'Pain Relief',
      description: 'Pain reliever and fever reducer'
    },
    {
      id: 'med_004',
      name: 'Amoxicillin',
      generic_name: 'Amoxicillin',
      cost: 12.99,
      suggested_price: 19.99,
      category: 'Antibiotics',
      description: 'Antibiotic for bacterial infections'
    },
    {
      id: 'med_005',
      name: 'Lisinopril',
      generic_name: 'Lisinopril',
      cost: 16.99,
      suggested_price: 24.99,
      category: 'Blood Pressure',
      description: 'ACE inhibitor for high blood pressure'
    }
  ];

  async getInventory(gameId: string): Promise<InventoryItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/inventory/game/${gameId}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch inventory from API, using mock data:', error);
      return this.mockInventory;
    }
  }

  async getLowStockItems(gameId: string): Promise<InventoryItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/inventory/game/${gameId}/low-stock`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch low stock items from API, using mock data:', error);
      return this.mockInventory.filter(item => item.quantity <= item.reorder_point);
    }
  }

  async getExpiringItems(gameId: string): Promise<InventoryItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/inventory/game/${gameId}/expiring`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch expiring items from API, using mock data:', error);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return this.mockInventory.filter(item => 
        item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow
      );
    }
  }

  async restockItem(itemId: string, quantity: number, cost: number): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/inventory/${itemId}/restock`, {
        quantity,
        cost
      });
    } catch (error) {
      console.warn('Failed to restock item via API:', error);
      // Update mock data
      const item = this.mockInventory.find(i => i.id === itemId);
      if (item) {
        item.quantity += quantity;
        item.cost = cost;
      }
    }
  }

  async updatePrice(itemId: string, price: number): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/inventory/${itemId}/price`, {
        price
      });
    } catch (error) {
      console.warn('Failed to update price via API:', error);
      // Update mock data
      const item = this.mockInventory.find(i => i.id === itemId);
      if (item) {
        item.price = price;
      }
    }
  }

  // Get mock data for immediate use
  getMockInventory(): InventoryItem[] {
    return [...this.mockInventory];
  }

  getMockLowStockItems(): InventoryItem[] {
    return this.mockInventory.filter(item => item.quantity <= item.reorder_point);
  }

  getMockExpiringItems(): InventoryItem[] {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.mockInventory.filter(item => 
      item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow
    );
  }

  // Get available medications for purchase
  getAvailableMedications() {
    return [...this.availableMedications];
  }

  // Purchase new medication (add to inventory)
  async purchaseMedication(medicationId: string, quantity: number, price: number): Promise<void> {
    const medication = this.availableMedications.find(med => med.id === medicationId);
    if (!medication) {
      throw new Error('Medication not found');
    }

    const newInventoryItem: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      medication_id: medication.id,
      medication_name: medication.name,
      generic_name: medication.generic_name,
      quantity: quantity,
      price: price,
      cost: medication.cost,
      reorder_point: 10,
      expiry_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      category: medication.category
    };

    try {
      // Try to add via API
      await axios.post(`${this.baseURL}/inventory`, newInventoryItem);
    } catch (error) {
      console.warn('Failed to purchase medication via API:', error);
      // Add to mock data
      this.mockInventory.push(newInventoryItem);
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService; 