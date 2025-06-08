import { Schema, model, Document } from 'mongoose';

interface IInventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  purchasePrice: number;
}

interface IUpgrade {
  id: string;
  name: string;
  type: 'location' | 'marketing' | 'inventory';
  level: number;
  cost: number;
  effects: {
    [key: string]: number;
  };
}

interface IMonthlyExpenses {
  rent: number;
  salaries: number;
  utilities: number;
  insurance: number;
}

export interface IGameState extends Document {
  cash: number;
  reputation: number;
  inventory: IInventoryItem[];
  upgrades: IUpgrade[];
  day: number;
  monthlyExpenses: IMonthlyExpenses;
  lastUpdated: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 }
});

const upgradeSchema = new Schema<IUpgrade>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['location', 'marketing', 'inventory'] },
  level: { type: Number, required: true, min: 1 },
  cost: { type: Number, required: true, min: 0 },
  effects: { type: Map, of: Number }
});

const monthlyExpensesSchema = new Schema<IMonthlyExpenses>({
  rent: { type: Number, required: true, min: 0 },
  salaries: { type: Number, required: true, min: 0 },
  utilities: { type: Number, required: true, min: 0 },
  insurance: { type: Number, required: true, min: 0 }
});

const gameStateSchema = new Schema<IGameState>({
  cash: { type: Number, required: true, min: 0 },
  reputation: { type: Number, required: true, min: 0, max: 100 },
  inventory: [inventoryItemSchema],
  upgrades: [upgradeSchema],
  day: { type: Number, required: true, min: 1 },
  monthlyExpenses: monthlyExpensesSchema,
  lastUpdated: { type: Date, default: Date.now }
});

// Add methods to calculate daily revenue, expenses, etc.
gameStateSchema.methods.calculateDailyRevenue = function(): number {
  return this.inventory.reduce((total: number, item: IInventoryItem) => {
    return total + (item.price - item.purchasePrice) * item.quantity;
  }, 0);
};

gameStateSchema.methods.calculateMonthlyExpenses = function(): number {
  const { rent, salaries, utilities, insurance } = this.monthlyExpenses;
  return rent + salaries + utilities + insurance;
};

export const GameState = model<IGameState>('GameState', gameStateSchema); 