import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/gameSlice';

interface Customer {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  insuranceProvider?: string;
  insuranceNumber?: string;
  chronicConditions?: string[];
  allergies?: string[];
  preferredPaymentMethod?: string;
  lastVisit?: string;
  totalSpent: number;
}

interface CustomerVisit {
  id: string;
  customerId: string;
  visitDate: string;
  totalAmount: number;
  prescriptionsFilled: number;
  satisfaction: number;
  feedback?: string;
  items: {
    medicationId: string;
    quantity: number;
    price: number;
  }[];
}

const CustomerManager: React.FC = () => {
  const dispatch = useDispatch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVisits, setCustomerVisits] = useState<CustomerVisit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    type: 'regular',
    email: '',
    phone: '',
    insuranceProvider: '',
    insuranceNumber: '',
  });

  useEffect(() => {
    if (searchQuery) {
      searchCustomers();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerVisits(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/customers/search?q=${searchQuery}`);
      setCustomers(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to search customers'
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerVisits = async (customerId: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/customers/${customerId}/visits`);
      setCustomerVisits(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customer visits'
      }));
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/customers', newCustomerData);
      dispatch(addNotification({
        type: 'success',
        message: 'Customer created successfully'
      }));
      setShowNewCustomerModal(false);
      setNewCustomerData({
        name: '',
        type: 'regular',
        email: '',
        phone: '',
        insuranceProvider: '',
        insuranceNumber: '',
      });
      if (searchQuery) {
        searchCustomers();
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to create customer'
      }));
    }
  };

  const handleUpdateLoyaltyPoints = async (customerId: string, points: number) => {
    try {
      await axios.patch(`http://localhost:3000/api/customers/${customerId}/loyalty-points`, {
        points
      });
      
      const updatedCustomer = customers.find(c => c.id === customerId);
      if (updatedCustomer) {
        updatedCustomer.loyaltyPoints += points;
        setCustomers([...customers]);
      }

      dispatch(addNotification({
        type: 'success',
        message: 'Loyalty points updated successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update loyalty points'
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowNewCustomerModal(true)}
          >
            New Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Customer List */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Loyalty Points</th>
                <th className="px-4 py-2 text-right">Total Spent</th>
                <th className="px-4 py-2 text-right">Last Visit</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} className="border-b">
                  <td className="px-4 py-2">{customer.name}</td>
                  <td className="px-4 py-2">{customer.type}</td>
                  <td className="px-4 py-2 text-right">{customer.loyaltyPoints}</td>
                  <td className="px-4 py-2 text-right">${customer.totalSpent.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="text-blue-600 hover:text-blue-800 mr-2"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">New Customer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newCustomerData.type}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="regular">Regular</option>
                  <option value="oneTime">One Time</option>
                  <option value="elderly">Elderly</option>
                  <option value="parent">Parent</option>
                  <option value="chronicCondition">Chronic Condition</option>
                  <option value="insurance">Insurance</option>
                  <option value="corporate">Corporate</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="student">Student</option>
                  <option value="athlete">Athlete</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={newCustomerData.insuranceProvider}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, insuranceProvider: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Insurance Number</label>
                <input
                  type="text"
                  value={newCustomerData.insuranceNumber}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, insuranceNumber: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowNewCustomerModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleCreateCustomer}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{selectedCustomer.name}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-semibold">Customer Information</h4>
                <p>Type: {selectedCustomer.type}</p>
                <p>Email: {selectedCustomer.email || '-'}</p>
                <p>Phone: {selectedCustomer.phone || '-'}</p>
                <p>Insurance: {selectedCustomer.insuranceProvider || '-'}</p>
                <p>Loyalty Points: {selectedCustomer.loyaltyPoints}</p>
                <p>Total Spent: ${selectedCustomer.totalSpent.toFixed(2)}</p>
              </div>

              <div>
                <h4 className="font-semibold">Medical Information</h4>
                <p>Chronic Conditions: {selectedCustomer.chronicConditions?.join(', ') || 'None'}</p>
                <p>Allergies: {selectedCustomer.allergies?.join(', ') || 'None'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Visit History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right">Prescriptions</th>
                      <th className="px-4 py-2 text-center">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerVisits.map(visit => (
                      <tr key={visit.id} className="border-b">
                        <td className="px-4 py-2">
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ${visit.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {visit.prescriptionsFilled}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {'⭐'.repeat(visit.satisfaction)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager; 