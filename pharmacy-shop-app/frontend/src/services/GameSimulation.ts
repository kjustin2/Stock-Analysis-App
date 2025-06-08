import { Dispatch } from '@reduxjs/toolkit';
import {
  advanceTime,
  addNotification,
  updateCustomerLoyalty,
  updateStaffSatisfaction,
  updatePrice,
  purchaseInventory,
  sellInventory,
  addCustomer,
  addCustomerFeedback,
  type Customer,
  type InventoryItem,
  type StaffMember,
} from '../store/gameSlice';

export class GameSimulation {
  private dispatch: Dispatch;
  private gameState: any; // Will be properly typed when connected
  private eventProbabilities = {
    customerArrival: 0.3,
    staffEvent: 0.1,
    marketEvent: 0.05,
    specialEvent: 0.02,
  };

  constructor(dispatch: Dispatch, getState: () => any) {
    this.dispatch = dispatch;
    this.gameState = getState().game;
  }

  public update(deltaMinutes: number) {
    // Update game state based on time passed
    this.dispatch(advanceTime(deltaMinutes));
    
    // Run simulation steps
    this.simulateCustomerActivity(deltaMinutes);
    this.simulateStaffActivity(deltaMinutes);
    this.simulateMarketChanges(deltaMinutes);
    this.simulateRandomEvents(deltaMinutes);
  }

  private simulateCustomerActivity(deltaMinutes: number) {
    const baseCustomerChance = this.eventProbabilities.customerArrival * (deltaMinutes / 60);
    const timeMultiplier = this.getTimeBasedMultiplier();
    const reputationMultiplier = this.getReputationMultiplier();
    
    if (Math.random() < baseCustomerChance * timeMultiplier * reputationMultiplier) {
      this.generateCustomerVisit();
    }
  }

  private simulateStaffActivity(deltaMinutes: number) {
    const baseStaffEventChance = this.eventProbabilities.staffEvent * (deltaMinutes / 60);
    
    this.gameState.staff.forEach((staff: StaffMember) => {
      // Update staff satisfaction based on workload and conditions
      const satisfactionChange = this.calculateStaffSatisfactionChange(staff, deltaMinutes);
      this.dispatch(updateStaffSatisfaction({
        staffId: staff.id,
        satisfaction: Math.max(0, Math.min(100, staff.satisfaction + satisfactionChange)),
      }));

      // Random staff events
      if (Math.random() < baseStaffEventChance) {
        this.generateStaffEvent(staff);
      }
    });
  }

  private simulateMarketChanges(deltaMinutes: number) {
    const baseMarketEventChance = this.eventProbabilities.marketEvent * (deltaMinutes / 60);
    
    if (Math.random() < baseMarketEventChance) {
      this.generateMarketEvent();
    }

    // Regular price adjustments based on market conditions
    this.gameState.inventory.forEach((item: InventoryItem) => {
      const priceChange = this.calculateMarketPriceChange(item);
      if (priceChange !== 0) {
        this.dispatch(updatePrice({
          itemId: item.id,
          price: Math.max(item.cost, item.price + priceChange),
        }));
      }
    });
  }

  private simulateRandomEvents(deltaMinutes: number) {
    const baseSpecialEventChance = this.eventProbabilities.specialEvent * (deltaMinutes / 60);
    
    if (Math.random() < baseSpecialEventChance) {
      this.generateSpecialEvent();
    }
  }

  private getTimeBasedMultiplier(): number {
    const hour = this.gameState.currentTime.hour;
    // Peak hours: 9-11 AM and 4-6 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 16 && hour <= 18)) {
      return 1.5;
    }
    // Lunch hour: 12-2 PM
    if (hour >= 12 && hour <= 14) {
      return 1.2;
    }
    // Early morning and late evening
    if (hour < 8 || hour > 19) {
      return 0.5;
    }
    return 1.0;
  }

  private getReputationMultiplier(): number {
    return 0.5 + (this.gameState.reputation / 100) * 1.5;
  }

  private generateCustomerVisit() {
    const customerTypes: Array<Customer['type']> = [
      'regular', 'oneTime', 'elderly', 'parent', 'chronicCondition',
      'insurance', 'corporate', 'healthcare', 'student', 'athlete'
    ];
    
    const customer: Customer = {
      id: Date.now().toString(),
      type: customerTypes[Math.floor(Math.random() * customerTypes.length)],
      name: this.generateCustomerName(),
      loyaltyPoints: 0,
      visitHistory: [],
      preferences: {
        preferredPayment: this.getRandomPaymentMethod(),
        preferredDays: this.getRandomPreferredDays(),
        preferredTimes: this.getRandomPreferredTimes(),
        genericPreference: Math.random() > 0.3,
      },
      lastVisit: new Date().toISOString(),
      totalSpent: 0,
      referralCount: 0,
      feedbackHistory: [],
    };

    this.dispatch(addCustomer(customer));
    this.processCustomerPurchase(customer);
  }

  private generateStaffEvent(staff: StaffMember) {
    const events = [
      {
        type: 'training',
        message: `${staff.name} completed a training module`,
        effect: () => {
          const skillIncrease = Math.random() * 0.1;
          // Update staff skills
        },
      },
      {
        type: 'performance',
        message: `${staff.name} had an exceptional performance today`,
        effect: () => {
          const satisfactionIncrease = Math.random() * 5;
          this.dispatch(updateStaffSatisfaction({
            staffId: staff.id,
            satisfaction: Math.min(100, staff.satisfaction + satisfactionIncrease),
          }));
        },
      },
      // Add more staff events
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    this.dispatch(addNotification({
      type: 'info',
      message: event.message,
    }));
  }

  private generateMarketEvent() {
    const events = [
      {
        type: 'shortage',
        message: 'Supply shortage affecting certain medications',
        effect: () => {
          // Increase prices and reduce availability
        },
      },
      {
        type: 'competition',
        message: 'New competitor offering promotional discounts',
        effect: () => {
          // Adjust market prices
        },
      },
      // Add more market events
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    this.dispatch(addNotification({
      type: 'warning',
      message: event.message,
    }));
  }

  private generateSpecialEvent() {
    const events = [
      {
        type: 'health_fair',
        message: 'Local health fair increasing customer traffic',
        effect: () => {
          this.eventProbabilities.customerArrival *= 1.5;
          setTimeout(() => {
            this.eventProbabilities.customerArrival /= 1.5;
          }, 1000 * 60 * 60); // Effect lasts for 1 hour
        },
      },
      {
        type: 'inspection',
        message: 'Health inspector visiting today',
        effect: () => {
          // Temporary effect on operations
        },
      },
      // Add more special events
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    this.dispatch(addNotification({
      type: 'special',
      message: event.message,
    }));
  }

  private calculateStaffSatisfactionChange(staff: StaffMember, deltaMinutes: number): number {
    let change = 0;
    
    // Base satisfaction decay
    change -= 0.001 * deltaMinutes;
    
    // Workload impact
    const workload = this.calculateStaffWorkload(staff);
    if (workload > 0.8) {
      change -= 0.002 * deltaMinutes;
    } else if (workload < 0.4) {
      change += 0.001 * deltaMinutes;
    }
    
    // Break time impact
    if (this.isOnBreak(staff)) {
      change += 0.005 * deltaMinutes;
    }
    
    return change;
  }

  private calculateMarketPriceChange(item: InventoryItem): number {
    const baseChange = (Math.random() - 0.5) * 0.02 * item.cost; // ±1% of cost
    const demandFactor = this.calculateDemandFactor(item);
    const competitionFactor = this.calculateCompetitionFactor(item);
    
    return baseChange * demandFactor * competitionFactor;
  }

  private processCustomerPurchase(customer: Customer) {
    const purchaseAmount = this.calculatePurchaseAmount(customer);
    const satisfaction = this.calculateCustomerSatisfaction(customer);
    
    // Update customer history
    this.dispatch(updateCustomerLoyalty({
      customerId: customer.id,
      points: Math.floor(purchaseAmount / 10),
    }));

    this.dispatch(addCustomerFeedback({
      customerId: customer.id,
      rating: satisfaction,
      comment: this.generateFeedbackComment(satisfaction),
    }));
  }

  // Helper methods
  private generateCustomerName(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private getRandomPaymentMethod(): string {
    const methods = ['cash', 'credit', 'debit', 'insurance'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  private getRandomPreferredDays(): string[] {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.filter(() => Math.random() > 0.5);
  }

  private getRandomPreferredTimes(): string[] {
    const times = ['morning', 'afternoon', 'evening'];
    return times.filter(() => Math.random() > 0.5);
  }

  private calculateStaffWorkload(staff: StaffMember): number {
    // Implement workload calculation based on customer traffic and staff schedule
    return Math.random(); // Placeholder
  }

  private isOnBreak(staff: StaffMember): boolean {
    const currentTime = `${this.gameState.currentTime.hour}:${this.gameState.currentTime.minute}`;
    return staff.breakSchedule[new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()]
      ?.includes(currentTime) || false;
  }

  private calculateDemandFactor(item: InventoryItem): number {
    // Implement demand calculation based on sales history and season
    return 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
  }

  private calculateCompetitionFactor(item: InventoryItem): number {
    // Implement competition factor based on market analysis
    return 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
  }

  private calculatePurchaseAmount(customer: Customer): number {
    // Implement purchase amount calculation based on customer type and preferences
    return Math.random() * 100 + 20; // Placeholder
  }

  private calculateCustomerSatisfaction(customer: Customer): number {
    // Implement satisfaction calculation based on service quality and prices
    return Math.floor(Math.random() * 3 + 3); // 3-5 rating
  }

  private generateFeedbackComment(satisfaction: number): string {
    const comments = {
      5: [
        'Excellent service!',
        'Very helpful staff',
        'Great prices and selection',
      ],
      4: [
        'Good experience overall',
        'Satisfied with the service',
        'Would come back',
      ],
      3: [
        'Average service',
        'Could be better',
        'Some items were out of stock',
      ],
    };
    return comments[satisfaction as keyof typeof comments][
      Math.floor(Math.random() * comments[satisfaction as keyof typeof comments].length)
    ];
  }
}

export default GameSimulation; 