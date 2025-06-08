import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer as ServiceCustomer, CustomerPurchase, CustomerStats } from '../services/CustomerService';

// Types
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  cost: number;
  category: string;
  expiryDate: string;
  reorderPoint: number;
  isGeneric: boolean;
  manufacturer: string;
  popularity: number;
  lastRestockDate: string;
  minimumOrderQuantity: number;
  bulkDiscountThreshold: number;
  bulkDiscountPercentage: number;
  requiresPrescription: boolean;
  insuranceReimbursementRate: number;
  alternativeIds: string[];
  sideEffects: string[];
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'location' | 'marketing' | 'inventory' | 'staff' | 'technology';
  effect: {
    type: string;
    value: number;
  }[];
  prerequisites: string[];
  installed: boolean;
  installationDate?: string;
  maintenanceCost: number;
  level: number;
  maxLevel: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  experience: number;
  satisfaction: number;
  skills: string[];
  certifications: string[];
  schedule: {
    [key: string]: boolean;
  };
  performance: number;
  hireDate: string;
  lastReviewDate: string;
  trainingProgress: {
    [key: string]: number;
  };
  specializations: string[];
  bonusEligible: boolean;
  overtimeHours: number;
  breakSchedule: {
    [key: string]: string[];
  };
}

export interface Customer {
  id: string;
  type: 'regular' | 'oneTime' | 'elderly' | 'parent' | 'chronicCondition' | 'insurance' | 'corporate' | 'healthcare' | 'student' | 'athlete';
  name: string;
  loyaltyPoints: number;
  visitHistory: {
    date: string;
    purchaseAmount: number;
    items: string[];
    satisfaction: number;
  }[];
  preferences: {
    preferredPayment: string;
    preferredDays: string[];
    preferredTimes: string[];
    genericPreference: boolean;
  };
  insuranceProvider?: string;
  chronicConditions?: string[];
  allergies?: string[];
  lastVisit: string;
  totalSpent: number;
  referralCount: number;
  feedbackHistory: {
    date: string;
    rating: number;
    comment: string;
  }[];
}

export interface DailyStats {
  date: string;
  revenue: number;
  expenses: number;
  customers: number;
  prescriptionsFilled: number;
  customerSatisfaction: number;
  staffPerformance: number;
  inventoryTurnover: number;
  profitMargin: number;
  peakHours: {
    hour: number;
    customers: number;
  }[];
  categoryPerformance: {
    [key: string]: {
      sales: number;
      profit: number;
    };
  };
  events: {
    type: string;
    impact: number;
    description: string;
  }[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export interface GameState {
  // Basic Info
  id: string;
  money: number;
  reputation: number;
  day: number;
  customerSatisfaction: number;
  
  // Game Time
  currentTime: {
    hour: number;
    minute: number;
  };
  gameSpeed: number;
  isPaused: boolean;
  
  // Core Systems
  inventory: InventoryItem[];
  staff: StaffMember[];
  customers: Customer[];
  upgrades: Upgrade[];
  
  // Customer System
  activeCustomers: ServiceCustomer[];
  customerStats: CustomerStats;
  recentPurchases: CustomerPurchase[];
  
  // Statistics
  dailyStats: DailyStats[];
  monthlyExpenses: {
    rent: number;
    utilities: number;
    insurance: number;
    maintenance: number;
    salaries: number;
    marketing: number;
    other: number;
  };
  
  // Game Settings
  difficulty: 'easy' | 'normal' | 'hard';
  tutorials: {
    [key: string]: {
      completed: boolean;
      date: string;
    };
  };
  achievements: {
    [key: string]: {
      unlocked: boolean;
      progress: number;
      date?: string;
    };
  };
  
  // Store Status
  isOpen: boolean;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  
  // System Status
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

const initialState: GameState = {
  // Basic Info
  id: '',
  money: 10000,
  reputation: 50,
  day: 1,
  customerSatisfaction: 75,
  
  // Game Time
  currentTime: {
    hour: 9,
    minute: 0,
  },
  gameSpeed: 1,
  isPaused: true,
  
  // Core Systems
  inventory: [],
  staff: [],
  customers: [],
  upgrades: [],
  
  // Customer System
  activeCustomers: [],
  customerStats: {
    totalCustomers: 0,
    servedCustomers: 0,
    lostCustomers: 0,
    totalRevenue: 0,
    averageSatisfaction: 0,
    averageSpending: 0
  },
  recentPurchases: [],
  
  // Statistics
  dailyStats: [],
  monthlyExpenses: {
    rent: 2000,
    utilities: 500,
    insurance: 800,
    maintenance: 300,
    salaries: 0,
    marketing: 0,
    other: 0,
  },
  
  // Game Settings
  difficulty: 'normal',
  tutorials: {},
  achievements: {},
  
  // Store Status
  isOpen: false,
  openingHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { open: '10:00', close: '14:00' },
  },
  
  // System Status
  loading: false,
  error: null,
  notifications: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Time Management
    setGameSpeed(state, action: PayloadAction<number>) {
      state.gameSpeed = action.payload;
    },
    togglePause(state) {
      state.isPaused = !state.isPaused;
    },
    advanceTime(state, action: PayloadAction<number>) {
      // Advance time by specified minutes
      state.currentTime.minute += action.payload;
      while (state.currentTime.minute >= 60) {
        state.currentTime.minute -= 60;
        state.currentTime.hour += 1;
      }
      if (state.currentTime.hour >= 24) {
        state.currentTime.hour = 0;
        state.day += 1;
      }
    },
    
    // Inventory Management
    purchaseInventory(state, action: PayloadAction<{ itemId: string; quantity: number }>) {
      const item = state.inventory.find(i => i.id === action.payload.itemId);
      if (item) {
        const cost = item.cost * action.payload.quantity;
        if (cost <= state.money) {
          item.quantity += action.payload.quantity;
          item.lastRestockDate = new Date().toISOString();
          state.money -= cost;
        }
      }
    },
    sellInventory(state, action: PayloadAction<{ itemId: string; quantity: number; price: number }>) {
      const item = state.inventory.find(i => i.id === action.payload.itemId);
      if (item && item.quantity >= action.payload.quantity) {
        item.quantity -= action.payload.quantity;
        state.money += action.payload.price * action.payload.quantity;
      }
    },
    updatePrice(state, action: PayloadAction<{ itemId: string; price: number }>) {
      const item = state.inventory.find(i => i.id === action.payload.itemId);
      if (item) {
        item.price = action.payload.price;
      }
    },
    
    // Staff Management
    hireStaff(state, action: PayloadAction<StaffMember>) {
      state.staff.push(action.payload);
    },
    updateStaffSchedule(state, action: PayloadAction<{ staffId: string; schedule: { [key: string]: boolean } }>) {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.schedule = action.payload.schedule;
      }
    },
    updateStaffSatisfaction(state, action: PayloadAction<{ staffId: string; satisfaction: number }>) {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.satisfaction = action.payload.satisfaction;
      }
    },
    addStaffTraining(state, action: PayloadAction<{ staffId: string; training: string }>) {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.trainingProgress[action.payload.training] = 0;
      }
    },
    updateTrainingProgress(state, action: PayloadAction<{ staffId: string; training: string; progress: number }>) {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.trainingProgress[action.payload.training] = action.payload.progress;
      }
    },
    terminateStaff(state, action: PayloadAction<string>) {
      state.staff = state.staff.filter(s => s.id !== action.payload);
    },
    
    // Customer Management
    addCustomer(state, action: PayloadAction<Customer>) {
      state.customers.push(action.payload);
    },
    updateCustomerLoyalty(state, action: PayloadAction<{ customerId: string; points: number }>) {
      const customer = state.customers.find(c => c.id === action.payload.customerId);
      if (customer) {
        customer.loyaltyPoints += action.payload.points;
      }
    },
    addCustomerFeedback(state, action: PayloadAction<{ customerId: string; rating: number; comment: string }>) {
      const customer = state.customers.find(c => c.id === action.payload.customerId);
      if (customer) {
        customer.feedbackHistory.push({
          date: new Date().toISOString(),
          rating: action.payload.rating,
          comment: action.payload.comment,
        });
      }
    },
    
    // Upgrade System
    purchaseUpgrade(state, action: PayloadAction<Upgrade>) {
      if (state.money >= action.payload.cost) {
        state.upgrades.push({
          ...action.payload,
          installed: true,
          installationDate: new Date().toISOString(),
        });
        state.money -= action.payload.cost;
      }
    },
    upgradeLevel(state, action: PayloadAction<{ upgradeId: string }>) {
      const upgrade = state.upgrades.find(u => u.id === action.payload.upgradeId);
      if (upgrade && upgrade.level < upgrade.maxLevel) {
        upgrade.level += 1;
        // Apply upgrade effects
      }
    },
    
    // Game Progress
    completeTutorial(state, action: PayloadAction<string>) {
      state.tutorials[action.payload] = {
        completed: true,
        date: new Date().toISOString(),
      };
    },
    unlockAchievement(state, action: PayloadAction<string>) {
      if (state.achievements[action.payload]) {
        state.achievements[action.payload].unlocked = true;
        state.achievements[action.payload].date = new Date().toISOString();
      }
    },
    updateAchievementProgress(state, action: PayloadAction<{ achievement: string; progress: number }>) {
      if (state.achievements[action.payload.achievement]) {
        state.achievements[action.payload.achievement].progress = action.payload.progress;
      }
    },
    
    // Store Operations
    toggleStore(state) {
      state.isOpen = !state.isOpen;
    },
    updateOpeningHours(state, action: PayloadAction<{ day: string; hours: { open: string; close: string } }>) {
      state.openingHours[action.payload.day] = action.payload.hours;
    },
    
    // System Status
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) {
      state.notifications.push({
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    updateMoney(state, action: PayloadAction<number>) {
      state.money = action.payload;
    },
    updateReputation(state, action: PayloadAction<number>) {
      state.reputation = action.payload;
    },
    updateCustomerSatisfaction(state, action: PayloadAction<number>) {
      state.customerSatisfaction = action.payload;
    },
    
    // Game Initialization
    initializeGame(state, action: PayloadAction<{ id: string; money: number; reputation: number; day: number; inventory: any[] }>) {
      state.id = action.payload.id;
      state.money = action.payload.money;
      state.reputation = action.payload.reputation;
      state.day = action.payload.day;
      state.inventory = action.payload.inventory.map(item => ({
        id: item.id,
        name: item.medication_name || item.name,
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        category: item.category || 'General',
        expiryDate: item.expiry_date || '',
        reorderPoint: item.reorder_point || 10,
        isGeneric: false,
        manufacturer: 'Generic',
        popularity: 50,
        lastRestockDate: new Date().toISOString(),
        minimumOrderQuantity: 1,
        bulkDiscountThreshold: 100,
        bulkDiscountPercentage: 10,
        requiresPrescription: false,
        insuranceReimbursementRate: 80,
        alternativeIds: [],
        sideEffects: []
      }));
      state.loading = false;
      state.error = null;
    },
    
    // Customer System Actions
    updateActiveCustomers(state, action: PayloadAction<ServiceCustomer[]>) {
      state.activeCustomers = action.payload;
    },
    
    updateCustomerStats(state, action: PayloadAction<CustomerStats>) {
      state.customerStats = action.payload;
    },
    
    addRecentPurchase(state, action: PayloadAction<CustomerPurchase>) {
      state.recentPurchases.unshift(action.payload);
      // Keep only last 20 purchases
      if (state.recentPurchases.length > 20) {
        state.recentPurchases = state.recentPurchases.slice(0, 20);
      }
    },
    
    addRecentPurchases(state, action: PayloadAction<CustomerPurchase[]>) {
      state.recentPurchases.unshift(...action.payload);
      // Keep only last 20 purchases
      if (state.recentPurchases.length > 20) {
        state.recentPurchases = state.recentPurchases.slice(0, 20);
      }
    }
  },
});

export const {
  setGameSpeed,
  togglePause,
  advanceTime,
  purchaseInventory,
  sellInventory,
  updatePrice,
  hireStaff,
  updateStaffSchedule,
  updateStaffSatisfaction,
  addStaffTraining,
  updateTrainingProgress,
  terminateStaff,
  addCustomer,
  updateCustomerLoyalty,
  addCustomerFeedback,
  purchaseUpgrade,
  upgradeLevel,
  completeTutorial,
  unlockAchievement,
  updateAchievementProgress,
  toggleStore,
  updateOpeningHours,
  setLoading,
  setError,
  addNotification,
  removeNotification,
  updateMoney,
  updateReputation,
  updateCustomerSatisfaction,
  initializeGame,
  updateActiveCustomers,
  updateCustomerStats,
  addRecentPurchase,
  addRecentPurchases
} = gameSlice.actions;

export default gameSlice.reducer; 