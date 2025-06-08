export interface Customer {
  id: string;
  name: string;
  type: 'regular' | 'walk-in' | 'prescription' | 'price-sensitive';
  arrivalTime: number;
  needs: string[]; // medication IDs they want
  budget: number;
  satisfaction: number;
  loyalty: number;
  patience: number; // how long they'll wait
  priceThreshold: number; // max price they'll pay
}

export interface CustomerPurchase {
  customerId: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  price: number;
  timestamp: number;
}

export interface CustomerStats {
  totalCustomers: number;
  servedCustomers: number;
  lostCustomers: number;
  totalRevenue: number;
  averageSatisfaction: number;
  averageSpending: number;
}

class CustomerService {
  private customers: Customer[] = [];
  private customerHistory: Customer[] = [];
  private purchases: CustomerPurchase[] = [];
  private customerIdCounter = 1;

  // Customer generation parameters
  private readonly CUSTOMER_NAMES = [
    'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown',
    'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen', 'Jack Anderson',
    'Kate Thompson', 'Liam Garcia', 'Maya Patel', 'Noah Martinez', 'Olivia White',
    'Paul Rodriguez', 'Quinn Jackson', 'Ruby Kim', 'Sam Williams', 'Tina Lopez'
  ];

  private readonly MEDICATION_DEMAND = {
    'med_001': 0.4, // Aspirin - high demand
    'med_002': 0.3, // Ibuprofen - medium-high demand
    'med_003': 0.35, // Acetaminophen - medium-high demand
    'med_004': 0.15, // Amoxicillin - low demand
    'med_005': 0.2   // Lisinopril - medium demand
  };

  generateCustomer(gameState: any): Customer | null {
    // Don't generate customers if store is closed
    if (!gameState.isOpen) return null;

    // Base customer generation rate (customers per minute when open)
    const baseRate = 0.1; // 6 customers per hour base rate
    
    // Factors affecting customer generation
    const reputationMultiplier = Math.max(0.5, gameState.reputation / 100);
    const timeMultiplier = this.getTimeMultiplier(gameState.currentTime.hour);
    const inventoryMultiplier = this.getInventoryMultiplier(gameState.inventory);
    
    const generationRate = baseRate * reputationMultiplier * timeMultiplier * inventoryMultiplier;
    
    // Random chance to generate customer
    if (Math.random() > generationRate) return null;

    const customerType = this.selectCustomerType();
    const customer: Customer = {
      id: `customer_${this.customerIdCounter++}`,
      name: this.CUSTOMER_NAMES[Math.floor(Math.random() * this.CUSTOMER_NAMES.length)],
      type: customerType,
      arrivalTime: Date.now(),
      needs: this.generateCustomerNeeds(customerType),
      budget: this.generateBudget(customerType),
      satisfaction: 75, // Starting satisfaction
      loyalty: customerType === 'regular' ? Math.random() * 50 + 50 : Math.random() * 30,
      patience: this.generatePatience(customerType),
      priceThreshold: this.generatePriceThreshold(customerType)
    };

    this.customers.push(customer);
    return customer;
  }

  private getTimeMultiplier(hour: number): number {
    // Rush hours: 8-10 AM, 12-2 PM, 5-7 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 19)) {
      return 1.5;
    }
    // Slow hours: 10 PM - 6 AM
    if (hour >= 22 || hour <= 6) {
      return 0.3;
    }
    return 1.0;
  }

  private getInventoryMultiplier(inventory: any[]): number {
    if (inventory.length === 0) return 0.1; // Very few customers if no inventory
    
    const stockedItems = inventory.filter(item => item.quantity > 0).length;
    const totalItems = inventory.length;
    
    return Math.max(0.3, stockedItems / totalItems);
  }

  private selectCustomerType(): Customer['type'] {
    const rand = Math.random();
    if (rand < 0.3) return 'regular';
    if (rand < 0.6) return 'walk-in';
    if (rand < 0.8) return 'prescription';
    return 'price-sensitive';
  }

  private generateCustomerNeeds(type: Customer['type']): string[] {
    const needs: string[] = [];
    const medicationIds = Object.keys(this.MEDICATION_DEMAND);
    
    switch (type) {
      case 'regular':
        // Regular customers often buy multiple items
        const numItems = Math.random() < 0.6 ? 2 : 1;
        for (let i = 0; i < numItems; i++) {
          const medId = medicationIds[Math.floor(Math.random() * medicationIds.length)];
          if (!needs.includes(medId)) needs.push(medId);
        }
        break;
        
      case 'prescription':
        // Prescription customers need specific medications
        const prescriptionMeds = ['med_004', 'med_005']; // Antibiotics and blood pressure
        needs.push(prescriptionMeds[Math.floor(Math.random() * prescriptionMeds.length)]);
        break;
        
      case 'walk-in':
      case 'price-sensitive':
        // Usually need common medications
        const commonMeds = ['med_001', 'med_002', 'med_003']; // Pain relievers
        needs.push(commonMeds[Math.floor(Math.random() * commonMeds.length)]);
        break;
    }
    
    return needs;
  }

  private generateBudget(type: Customer['type']): number {
    switch (type) {
      case 'regular': return Math.random() * 80 + 40; // $40-120
      case 'prescription': return Math.random() * 100 + 50; // $50-150
      case 'walk-in': return Math.random() * 60 + 20; // $20-80
      case 'price-sensitive': return Math.random() * 40 + 15; // $15-55
      default: return 50;
    }
  }

  private generatePatience(type: Customer['type']): number {
    // Patience in minutes
    switch (type) {
      case 'regular': return Math.random() * 10 + 15; // 15-25 minutes
      case 'prescription': return Math.random() * 15 + 20; // 20-35 minutes
      case 'walk-in': return Math.random() * 8 + 5; // 5-13 minutes
      case 'price-sensitive': return Math.random() * 12 + 8; // 8-20 minutes
      default: return 10;
    }
  }

  private generatePriceThreshold(type: Customer['type']): number {
    // Multiplier for acceptable price vs base cost
    switch (type) {
      case 'regular': return 1.8 + Math.random() * 0.4; // 1.8-2.2x cost
      case 'prescription': return 2.0 + Math.random() * 0.5; // 2.0-2.5x cost
      case 'walk-in': return 1.6 + Math.random() * 0.4; // 1.6-2.0x cost
      case 'price-sensitive': return 1.2 + Math.random() * 0.3; // 1.2-1.5x cost
      default: return 1.5;
    }
  }

  processCustomerPurchases(inventory: any[]): CustomerPurchase[] {
    const newPurchases: CustomerPurchase[] = [];
    const currentTime = Date.now();
    
    // Process each customer
    this.customers = this.customers.filter(customer => {
      const waitTime = (currentTime - customer.arrivalTime) / (1000 * 60); // minutes
      
      // Check if customer has run out of patience
      if (waitTime > customer.patience) {
        customer.satisfaction = Math.max(0, customer.satisfaction - 30);
        this.customerHistory.push(customer);
        return false; // Remove customer
      }

      // Try to fulfill customer needs
      let totalSpent = 0;
      let itemsPurchased = 0;
      
      for (const neededMedId of customer.needs) {
        const inventoryItem = inventory.find(item => 
          item.medication_id === neededMedId && item.quantity > 0
        );
        
        if (inventoryItem) {
          // Check if customer can afford and accepts the price
          const costRatio = inventoryItem.price / inventoryItem.cost;
          const canAfford = totalSpent + inventoryItem.price <= customer.budget;
          const acceptsPrice = costRatio <= customer.priceThreshold;
          
          if (canAfford && acceptsPrice) {
            // Customer makes purchase
            const purchase: CustomerPurchase = {
              customerId: customer.id,
              medicationId: inventoryItem.medication_id,
              medicationName: inventoryItem.medication_name,
              quantity: 1,
              price: inventoryItem.price,
              timestamp: currentTime
            };
            
            newPurchases.push(purchase);
            totalSpent += inventoryItem.price;
            itemsPurchased++;
            
            // Update inventory (this should be handled by the calling component)
            inventoryItem.quantity -= 1;
          }
        }
      }
      
      // Calculate customer satisfaction based on experience
      if (itemsPurchased === customer.needs.length) {
        // Got everything they needed
        customer.satisfaction = Math.min(100, customer.satisfaction + 20);
      } else if (itemsPurchased > 0) {
        // Got some items
        customer.satisfaction = Math.min(100, customer.satisfaction + 5);
      } else {
        // Got nothing
        customer.satisfaction = Math.max(0, customer.satisfaction - 15);
      }
      
      // Customer leaves after attempting to purchase
      this.customerHistory.push(customer);
      return false; // Remove from active customers
    });
    
    this.purchases.push(...newPurchases);
    return newPurchases;
  }

  getActiveCustomers(): Customer[] {
    return [...this.customers];
  }

  getCustomerStats(): CustomerStats {
    const totalCustomers = this.customerHistory.length;
    const servedCustomers = this.customerHistory.filter(c => 
      this.purchases.some(p => p.customerId === c.id)
    ).length;
    const lostCustomers = totalCustomers - servedCustomers;
    
    const totalRevenue = this.purchases.reduce((sum, p) => sum + p.price, 0);
    const averageSatisfaction = totalCustomers > 0 
      ? this.customerHistory.reduce((sum, c) => sum + c.satisfaction, 0) / totalCustomers 
      : 0;
    
    const customerSpending = this.purchases.reduce((acc, purchase) => {
      acc[purchase.customerId] = (acc[purchase.customerId] || 0) + purchase.price;
      return acc;
    }, {} as Record<string, number>);
    
    const spendingValues = Object.values(customerSpending);
    const averageSpending = spendingValues.length > 0
      ? spendingValues.reduce((sum, spending) => sum + spending, 0) / spendingValues.length
      : 0;

    return {
      totalCustomers,
      servedCustomers,
      lostCustomers,
      totalRevenue,
      averageSatisfaction,
      averageSpending
    };
  }

  getRecentPurchases(limit: number = 10): CustomerPurchase[] {
    return this.purchases
      .slice(-limit)
      .reverse(); // Most recent first
  }

  clearOldData(): void {
    // Keep only last 100 customers and 200 purchases for performance
    if (this.customerHistory.length > 100) {
      this.customerHistory = this.customerHistory.slice(-100);
    }
    if (this.purchases.length > 200) {
      this.purchases = this.purchases.slice(-200);
    }
  }

  // Reset service (for new game)
  reset(): void {
    this.customers = [];
    this.customerHistory = [];
    this.purchases = [];
    this.customerIdCounter = 1;
  }
}

export const customerService = new CustomerService();
export default customerService; 