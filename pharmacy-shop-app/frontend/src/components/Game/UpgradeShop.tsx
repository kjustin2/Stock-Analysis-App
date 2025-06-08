import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { purchaseUpgrade } from '../../store/gameSlice';
import type { RootState } from '../../store';
import type { Upgrade } from '../../store/gameSlice';
import InfoButton from '../UI/InfoButton';

// Mock upgrade data - in a real implementation, this would come from a configuration file or backend
const AVAILABLE_UPGRADES: Upgrade[] = [
  {
    id: 'drive-through',
    name: 'Drive-Through Window',
    description: 'Install a drive-through window to serve customers more efficiently.',
    cost: 25000,
    effect: 'Increases daily customer capacity by 25%',
  },
  {
    id: 'automation',
    name: 'Automated Dispensing System',
    description: 'Install an automated system for faster and more accurate prescription filling.',
    cost: 50000,
    effect: 'Reduces prescription filling time by 30%',
  },
  {
    id: 'consultation',
    name: 'Consultation Room',
    description: 'Add a private consultation room for patient counseling.',
    cost: 15000,
    effect: 'Enables premium consultation services',
  },
  {
    id: 'inventory',
    name: 'Inventory Management System',
    description: 'Implement a digital system for better inventory tracking and management.',
    cost: 20000,
    effect: 'Reduces inventory holding costs by 20%',
  },
  {
    id: 'loyalty',
    name: 'Customer Loyalty Program',
    description: 'Launch a program to reward regular customers.',
    cost: 10000,
    effect: 'Increases customer retention by 15%',
  },
];

const UpgradeShop: React.FC = () => {
  const dispatch = useDispatch();
  const { money, upgrades } = useSelector((state: RootState) => state.game);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'operations', 'marketing', 'infrastructure'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePurchase = (upgrade: Upgrade) => {
    if (money >= upgrade.cost) {
      dispatch(purchaseUpgrade(upgrade));
    }
  };

  const isUpgradePurchased = (upgradeId: string) => {
    return upgrades.some(u => u.id === upgradeId);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Upgrade Shop</h2>
            <InfoButton 
              title="Pharmacy Upgrades"
              content="Invest in permanent improvements to enhance your pharmacy's capabilities. Upgrades increase efficiency, customer capacity, and profitability. Choose wisely based on your business strategy."
            />
          </div>
          <p className="text-gray-600">Available funds: {formatCurrency(money)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter by category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AVAILABLE_UPGRADES.map((upgrade) => {
          const isPurchased = isUpgradePurchased(upgrade.id);
          const canAfford = money >= upgrade.cost;

          return (
            <div
              key={upgrade.id}
              className={`border rounded-lg p-4 ${
                isPurchased
                  ? 'bg-gray-50'
                  : canAfford
                  ? 'hover:shadow-md transition-shadow'
                  : 'opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{upgrade.name}</h3>
                  <p className="text-gray-600 text-sm">{upgrade.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(upgrade.cost)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm">
                  <span className="font-medium">Effect: </span>
                  {upgrade.effect}
                </div>
              </div>

              <button
                onClick={() => handlePurchase(upgrade)}
                disabled={isPurchased || !canAfford}
                className={`w-full py-2 px-4 rounded-lg ${
                  isPurchased
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : canAfford
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-100 text-red-600 cursor-not-allowed'
                }`}
              >
                {isPurchased
                  ? 'Purchased'
                  : canAfford
                  ? 'Purchase'
                  : 'Insufficient Funds'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>* Upgrades are permanent improvements to your pharmacy.</p>
        <p>* Some upgrades may unlock additional features or bonuses.</p>
        <p>* Effects stack with other upgrades and improvements.</p>
      </div>
    </div>
  );
};

export default UpgradeShop; 