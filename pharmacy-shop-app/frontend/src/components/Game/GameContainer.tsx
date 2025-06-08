import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { 
  setGameSpeed, 
  togglePause, 
  addNotification,
  toggleStore,
  advanceTime,
  initializeGame,
  setLoading,
  updateActiveCustomers,
  updateCustomerStats,
  addRecentPurchases,
  updateMoney
} from '../../store/gameSlice';
import GameSimulation from '../../services/GameSimulation';
import customerService from '../../services/CustomerService';
import Dashboard from './Dashboard';
import InventoryManager from './InventoryManager';
import UpgradeShop from './UpgradeShop';
import NotificationCenter from './NotificationCenter';
import TimeControls from './TimeControls';
import CompetitionDashboard from './CompetitionDashboard';
import WelcomeModal from './WelcomeModal';
import TutorialOverlay from './TutorialOverlay';
import CustomerQueue from './CustomerQueue';
import InfoButton from '../UI/InfoButton';

// Mock competitor data - in a real implementation, this would come from the game state
const MOCK_COMPETITORS = [
  {
    name: 'HealthMart Pharmacy',
    prices: {
      'aspirin': 6.99,
      'ibuprofen': 8.99,
      'acetaminophen': 7.49,
    },
  },
  {
    name: 'MediCare Plus',
    prices: {
      'aspirin': 7.49,
      'ibuprofen': 9.49,
      'acetaminophen': 7.99,
    },
  },
];

const GAME_SPEEDS = {
  PAUSED: 0,
  NORMAL: 1,
  FAST: 2,
  VERY_FAST: 3,
};

const REAL_TIME_RATIO = 60; // 1 second real time = 1 minute game time

const GameContainer: React.FC = () => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const { 
    money, 
    reputation, 
    day,
    currentTime,
    gameSpeed,
    isPaused,
    isOpen,
    openingHours,
    inventory,
    notifications,
    activeCustomers,
    customerStats,
    recentPurchases
  } = gameState;

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const simulationRef = useRef<GameSimulation | null>(null);

  // Initialize game and check if user is new
  useEffect(() => {
    const initializeGameState = async () => {
      if (!gameState.id) {
        dispatch(setLoading(true));
        try {
          const response = await fetch('http://localhost:3005/api/game/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const gameData = await response.json();
            dispatch(initializeGame(gameData));
          } else {
            dispatch(addNotification({
              type: 'error',
              message: 'Failed to initialize game'
            }));
          }
        } catch (error) {
          dispatch(addNotification({
            type: 'error',
            message: 'Failed to connect to game server'
          }));
        }
      }
    };

    initializeGameState();

    // Always show welcome modal at startup, but check if user has seen tutorial
    setShowWelcome(true);
  }, [dispatch, gameState.id]);

  // Initialize simulation
  useEffect(() => {
    simulationRef.current = new GameSimulation(
      dispatch,
      () => ({ game: gameState })
    );
  }, [dispatch, gameState]);

  // Game loop
  useEffect(() => {
    let gameLoop: NodeJS.Timeout;

    if (!isPaused && simulationRef.current) {
      gameLoop = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastUpdateTime;
        const gameMinutes = Math.floor((deltaTime / 1000) * REAL_TIME_RATIO * gameSpeed);
        
        if (gameMinutes > 0) {
          simulationRef.current?.update(gameMinutes);
          setLastUpdateTime(now);
          
          // Customer system updates
          updateCustomerSystem();
        }
      }, 1000 / gameSpeed);
    }

    return () => {
      if (gameLoop) {
        clearInterval(gameLoop);
      }
    };
  }, [gameSpeed, isPaused, lastUpdateTime, dispatch, gameState]);

  // Customer system update function
  const updateCustomerSystem = () => {
    // Generate new customers
    const newCustomer = customerService.generateCustomer(gameState);
    if (newCustomer) {
      dispatch(addNotification({
        type: 'info',
        message: `${newCustomer.name} entered the store (${newCustomer.type} customer)`
      }));
    }

    // Process customer purchases
    const purchases = customerService.processCustomerPurchases([...inventory]);
    if (purchases.length > 0) {
      // Update money from sales
      const totalRevenue = purchases.reduce((sum, purchase) => sum + purchase.price, 0);
      dispatch(updateMoney(money + totalRevenue));
      
      // Add purchase notifications
      purchases.forEach(purchase => {
        dispatch(addNotification({
          type: 'success',
          message: `Sold ${purchase.medicationName} for ${formatCurrency(purchase.price)}`
        }));
      });
      
      // Update Redux state
      dispatch(addRecentPurchases(purchases));
    }

    // Update customer state
    dispatch(updateActiveCustomers(customerService.getActiveCustomers()));
    dispatch(updateCustomerStats(customerService.getCustomerStats()));
    
    // Clean up old data periodically
    if (Math.random() < 0.1) { // 10% chance each update
      customerService.clearOldData();
    }
  };

  // Store hours management
  useEffect(() => {
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = openingHours[currentDay];
    
    if (hours) {
      const [openHour] = hours.open.split(':').map(Number);
      const [closeHour] = hours.close.split(':').map(Number);
      
      if (currentTime.hour === openHour && currentTime.minute === 0) {
        dispatch(toggleStore());
        dispatch(addNotification({
          type: 'info',
          message: 'Store is now open for business',
        }));
      } else if (currentTime.hour === closeHour && currentTime.minute === 0) {
        dispatch(toggleStore());
        dispatch(addNotification({
          type: 'info',
          message: 'Store is now closed',
        }));
      }
    }
  }, [currentTime, openingHours, dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed: number) => {
    if (speed === 0) {
      dispatch(togglePause());
    } else {
      dispatch(setGameSpeed(speed));
      dispatch(advanceTime(speed));
    }
  };

  const handleTogglePause = () => {
    dispatch(togglePause());
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManager />;
      case 'market':
        return <CompetitionDashboard />;
      case 'upgrades':
        return <UpgradeShop />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <div data-tutorial="time-controls">
              <TimeControls 
                isPaused={isPaused}
                currentSpeed={gameSpeed}
                onSpeedChange={handleSpeedChange}
                onTogglePause={handleTogglePause}
              />
            </div>
            <div className="text-lg font-semibold">
              Day {day} - {formatTime(currentTime.hour, currentTime.minute)}
            </div>
            <button
              onClick={() => dispatch(toggleStore())}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isOpen 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
              data-tutorial="shop-toggle"
            >
              {isOpen ? '🟢 Open - Click to Close' : '🔴 Closed - Click to Open'}
            </button>
          </div>
          <div className="flex space-x-8">
            <div className="text-lg">
              <span className="font-semibold text-blue-600">{formatCurrency(money)}</span>
            </div>
            <div className="text-lg">
              <span className="font-semibold text-green-600">{reputation}% Reputation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'dashboard', name: 'Dashboard', info: 'View your pharmacy\'s performance, finances, and daily statistics' },
              { id: 'inventory', name: 'Inventory', info: 'Manage your medication stock, set prices, and handle purchasing' },
              { id: 'market', name: 'Competition', info: 'Analyze competitors, track market share, and develop strategies to beat rival pharmacies' },
              { id: 'upgrades', name: 'Upgrades', info: 'Invest in improvements to enhance your pharmacy\'s capabilities' }
            ].map((tab) => (
              <div key={tab.id} className="flex items-center">
                <button
                  className={`px-4 py-2 rounded ${
                    activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  } mr-2 transition-colors`}
                  onClick={() => setActiveTab(tab.id)}
                  data-tutorial={`${tab.id}-tab`}
                >
                  {tab.name}
                </button>
                <InfoButton 
                  title={tab.name}
                  content={tab.info}
                  className="mr-4"
                />
              </div>
            ))}
          </nav>
        </div>

              {/* Tab Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {renderActiveTab()}
          </div>
          <div className="lg:col-span-1">
            <CustomerQueue customers={activeCustomers} />
          </div>
        </div>
      </div>
    </div>

    {/* Notifications */}
    <div data-tutorial="notifications">
      <NotificationCenter notifications={notifications} />
    </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          onStartTutorial={() => setShowTutorial(true)}
        />
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isActive={showTutorial}
        onComplete={() => setShowTutorial(false)}
      />
    </div>
  );
};

export default GameContainer; 