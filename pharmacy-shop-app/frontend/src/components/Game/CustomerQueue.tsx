import React from 'react';
import { Customer } from '../../services/CustomerService';

interface CustomerQueueProps {
  customers: Customer[];
  className?: string;
}

const CustomerQueue: React.FC<CustomerQueueProps> = ({ customers, className = '' }) => {
  const getCustomerTypeIcon = (type: Customer['type']) => {
    switch (type) {
      case 'regular': return '👤';
      case 'walk-in': return '🚶';
      case 'prescription': return '💊';
      case 'price-sensitive': return '💰';
      default: return '👤';
    }
  };

  const getCustomerTypeColor = (type: Customer['type']) => {
    switch (type) {
      case 'regular': return 'text-blue-600 bg-blue-50';
      case 'walk-in': return 'text-green-600 bg-green-50';
      case 'prescription': return 'text-purple-600 bg-purple-50';
      case 'price-sensitive': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getWaitTime = (arrivalTime: number) => {
    const waitMinutes = Math.floor((Date.now() - arrivalTime) / (1000 * 60));
    return waitMinutes;
  };

  const getPatienceColor = (customer: Customer) => {
    const waitTime = getWaitTime(customer.arrivalTime);
    const patienceRatio = waitTime / customer.patience;
    
    if (patienceRatio < 0.5) return 'text-green-600';
    if (patienceRatio < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (customers.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          👥 Customer Queue
          <span className="text-sm font-normal text-gray-500">(0 waiting)</span>
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏪</div>
          <p>No customers in store</p>
          <p className="text-sm">Open your pharmacy to attract customers!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        👥 Customer Queue
        <span className="text-sm font-normal text-gray-500">({customers.length} waiting)</span>
      </h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {customers.map((customer, index) => (
          <div 
            key={customer.id} 
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getCustomerTypeIcon(customer.type)}</div>
              <div>
                <div className="font-medium text-sm">{customer.name}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getCustomerTypeColor(customer.type)}`}>
                  {customer.type.replace('-', ' ')}
                </div>
              </div>
            </div>
            
            <div className="text-right text-sm">
              <div className={`font-medium ${getPatienceColor(customer)}`}>
                {getWaitTime(customer.arrivalTime)}m waiting
              </div>
              <div className="text-gray-500">
                ${customer.budget.toFixed(0)} budget
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {customers.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Avg. Wait:</span>
              <span className="ml-1 font-medium">
                {Math.round(customers.reduce((sum, c) => sum + getWaitTime(c.arrivalTime), 0) / customers.length)}m
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Budget:</span>
              <span className="ml-1 font-medium">
                ${customers.reduce((sum, c) => sum + c.budget, 0).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerQueue; 