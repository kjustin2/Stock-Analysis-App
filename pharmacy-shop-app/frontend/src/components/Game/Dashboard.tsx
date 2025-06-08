import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Line } from 'react-chartjs-2';
import type { RootState } from '../../store';
import type { ChartData, ChartOptions } from 'chart.js';
import ErrorBoundary from '../ErrorBoundary';
import InfoButton from '../UI/InfoButton';
import { addNotification, updateReputation } from '../../store/gameSlice';
import '../../utils/chartSetup'; // Import to register Chart.js components
import { defaultChartOptions, chartColors } from '../../utils/chartSetup';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { money, reputation, day, inventory, dailyStats, customerSatisfaction } = useSelector((state: RootState) => state.game);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Revenue chart data
  const revenueData: ChartData<'line'> = {
    labels: dailyStats.map((_, index) => `Day ${day - dailyStats.length + index + 1}`),
    datasets: [
      {
        label: 'Revenue',
        data: dailyStats.map(stat => stat.revenue),
        borderColor: chartColors.success,
        backgroundColor: chartColors.success + '20',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: dailyStats.map(stat => stat.expenses),
        borderColor: chartColors.danger,
        backgroundColor: chartColors.danger + '20',
        tension: 0.1,
      },
    ],
  };

  const customerData: ChartData<'line'> = {
    labels: dailyStats.map((_, index) => `Day ${day - dailyStats.length + index + 1}`),
    datasets: [
      {
        label: 'Customers',
        data: dailyStats.map(stat => stat.customers),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primary + '20',
        tension: 0.1,
      },
      {
        label: 'Prescriptions Filled',
        data: dailyStats.map(stat => stat.prescriptionsFilled),
        borderColor: chartColors.accent,
        backgroundColor: chartColors.accent + '20',
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        position: 'top' as const,
      },
    },
  };

  const calculateInventoryValue = () => {
    return inventory.reduce((total, item) => total + (item.cost * item.quantity), 0);
  };

  const calculateLowStockItems = () => {
    return inventory.filter(item => item.quantity < item.reorderPoint).length;
  };

  const calculateDailyProfit = () => {
    if (dailyStats.length === 0) return 0;
    const lastDay = dailyStats[dailyStats.length - 1];
    return lastDay.revenue - lastDay.expenses;
  };

  // Quick Action Handlers
  const handleRestockInventory = () => {
    dispatch(addNotification({
      type: 'info',
      message: 'Redirecting to Inventory tab for restocking...'
    }));
    // Switch to inventory tab (this would need to be handled by parent component)
    const inventoryTab = document.querySelector('[data-tutorial="inventory-tab"]') as HTMLElement;
    if (inventoryTab) {
      inventoryTab.click();
    }
  };

  const handleViewReports = () => {
    dispatch(addNotification({
      type: 'info',
      message: 'Daily reports: Revenue trends looking positive! Check charts above for detailed analysis.'
    }));
  };

  const handleManageStaff = () => {
    dispatch(addNotification({
      type: 'info',
      message: 'Staff management: All staff performing well. Consider hiring more during busy periods.'
    }));
  };

  const handleMarketing = () => {
    if (money >= 500) {
      dispatch(updateReputation(Math.min(100, reputation + 5)));
      dispatch(addNotification({
        type: 'success',
        message: 'Marketing campaign launched! +5 reputation boost for $500.'
      }));
    } else {
      dispatch(addNotification({
        type: 'warning',
        message: 'Need at least $500 to launch marketing campaign.'
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Pharmacy Dashboard</h2>
        <InfoButton 
          title="Dashboard Overview"
          content="Monitor your pharmacy's key performance indicators including cash flow, customer satisfaction, inventory value, and daily operations. Use this information to make strategic decisions."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Cash</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(money)}</p>
          <p className="text-sm text-blue-600">
            Daily Profit: {formatCurrency(calculateDailyProfit())}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Customer Metrics</h3>
          <p className="text-2xl font-bold text-green-600">{reputation}% Rep.</p>
          <p className="text-sm text-green-600">
            {customerSatisfaction}% Satisfaction
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Inventory Value</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(calculateInventoryValue())}
          </p>
          <p className="text-sm text-purple-600">
            {inventory.length} Total Items
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Alerts</h3>
          <p className="text-2xl font-bold text-red-600">{calculateLowStockItems()}</p>
          <p className="text-sm text-red-600">
            Low Stock Items
          </p>
        </div>
      </div>

      {/* Daily Performance */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Today's Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {dailyStats.length > 0 && (
            <>
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500">Revenue</h4>
                <p className="text-xl font-semibold">
                  {formatCurrency(dailyStats[dailyStats.length - 1].revenue)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500">Expenses</h4>
                <p className="text-xl font-semibold">
                  {formatCurrency(dailyStats[dailyStats.length - 1].expenses)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500">Customers</h4>
                <p className="text-xl font-semibold">
                  {dailyStats[dailyStats.length - 1].customers}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500">Prescriptions</h4>
                <p className="text-xl font-semibold">
                  {dailyStats[dailyStats.length - 1].prescriptionsFilled}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
          <div className="h-64">
            <ErrorBoundary>
              <Line 
                key="revenue-chart"
                data={revenueData} 
                options={chartOptions} 
              />
            </ErrorBoundary>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Customer Activity</h3>
          <div className="h-64">
            <ErrorBoundary>
              <Line 
                key="customer-chart"
                data={customerData} 
                options={chartOptions} 
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Inventory Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
            <p className="text-xl font-semibold">{inventory.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Categories</h4>
            <p className="text-xl font-semibold">
              {new Set(inventory.map(item => item.category)).size}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Avg. Margin</h4>
            <p className="text-xl font-semibold">
              {inventory.length > 0
                ? (inventory.reduce((sum, item) => 
                    sum + ((item.price - item.cost) / item.cost) * 100, 0
                  ) / inventory.length).toFixed(1)
                : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleRestockInventory}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restock Inventory
          </button>
          <button 
            onClick={handleViewReports}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Reports
          </button>
          <button 
            onClick={handleManageStaff}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Staff
          </button>
          <button 
            onClick={handleMarketing}
            className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Marketing ({formatCurrency(500)})
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 