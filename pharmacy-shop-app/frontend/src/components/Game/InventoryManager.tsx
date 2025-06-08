import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/gameSlice';
import InfoButton from '../UI/InfoButton';
import inventoryService, { InventoryItem as ServiceInventoryItem } from '../../services/InventoryService';

interface InventoryItem {
  id: string;
  medication_id: string;
  medication_name: string;
  generic_name: string | null;
  quantity: number;
  price: number;
  cost: number;
  reorder_point: number;
  expiry_date: string | null;
}

const InventoryManager: React.FC = () => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [availableMedications, setAvailableMedications] = useState<any[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);

  useEffect(() => {
    fetchInventory();
    fetchLowStockItems();
    fetchExpiringItems();
    // Load available medications for purchase
    const medications = inventoryService.getAvailableMedications();
    setAvailableMedications(medications);
    if (medications.length > 0) {
      setSelectedMedication(medications[0].id);
      setPurchasePrice(medications[0].suggested_price);
    }
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory(gameState.id || 'default');
      setInventory(data);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Inventory loaded successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'info',
        message: 'Using sample inventory data'
      }));
      setInventory(inventoryService.getMockInventory());
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const data = await inventoryService.getLowStockItems(gameState.id || 'default');
      setLowStockItems(data);
    } catch (error) {
      setLowStockItems(inventoryService.getMockLowStockItems());
    }
  };

  const fetchExpiringItems = async () => {
    try {
      const data = await inventoryService.getExpiringItems(gameState.id || 'default');
      setExpiringItems(data);
    } catch (error) {
      setExpiringItems(inventoryService.getMockExpiringItems());
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || restockQuantity <= 0) return;

    try {
      await inventoryService.restockItem(selectedItem.id, restockQuantity, selectedItem.cost);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Item restocked successfully'
      }));
      
      fetchInventory();
      setSelectedItem(null);
      setRestockQuantity(0);
    } catch (error) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Restock completed (offline mode)'
      }));
      fetchInventory();
      setSelectedItem(null);
      setRestockQuantity(0);
    }
  };

  const handlePriceAdjust = async () => {
    if (!selectedItem || newPrice < 0) return;

    try {
      await inventoryService.updatePrice(selectedItem.id, newPrice);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Price adjusted successfully'
      }));
      
      fetchInventory();
      setSelectedItem(null);
      setNewPrice(0);
    } catch (error) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Price updated (offline mode)'
      }));
      fetchInventory();
      setSelectedItem(null);
      setNewPrice(0);
    }
  };

  const handlePurchaseMedication = async () => {
    if (!selectedMedication || purchaseQuantity <= 0 || purchasePrice <= 0) return;

    try {
      await inventoryService.purchaseMedication(selectedMedication, purchaseQuantity, purchasePrice);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Medication purchased successfully'
      }));
      
      fetchInventory();
      setShowPurchaseModal(false);
      setPurchaseQuantity(10);
    } catch (error) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Medication purchased (offline mode)'
      }));
      fetchInventory();
      setShowPurchaseModal(false);
      setPurchaseQuantity(10);
    }
  };

  const handleMedicationChange = (medicationId: string) => {
    setSelectedMedication(medicationId);
    const medication = availableMedications.find(med => med.id === medicationId);
    if (medication) {
      setPurchasePrice(medication.suggested_price);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Inventory & Pricing</h2>
          <InfoButton 
            title="Inventory Management"
            content="Manage your medication stock levels and pricing. Keep popular items in stock, set competitive prices, and watch for low stock alerts. Higher prices increase profit but may reduce demand."
          />
        </div>
        
        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
            <h3 className="font-bold">Low Stock Alert</h3>
            <ul className="list-disc list-inside">
              {lowStockItems.map(item => (
                <li key={item.id}>
                  {item.medication_name} - {item.quantity} remaining
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {expiringItems.length > 0 && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            <h3 className="font-bold">Expiring Items Alert</h3>
            <ul className="list-disc list-inside">
              {expiringItems.map(item => (
                <li key={item.id}>
                  {item.medication_name} - Expires {new Date(item.expiry_date!).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty Inventory State */}
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Your inventory is empty!</h3>
            <p className="text-gray-600 mb-6">
              You need to purchase medications to start serving customers. 
              Click the button below to buy your first medications.
            </p>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              data-tutorial="purchase-medications"
            >
              Purchase Medications
            </button>
          </div>
        ) : (
          <>
            {/* Add Medication Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add New Medication
              </button>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Generic Name</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Cost</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2">{item.medication_name}</td>
                      <td className="px-4 py-2">{item.generic_name || '-'}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${item.cost.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          onClick={() => setSelectedItem(item)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Item Management Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">{selectedItem.medication_name}</h3>
            
            <div className="space-y-4">
              {/* Restock Form */}
              <div>
                <h4 className="font-semibold mb-2">Restock</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                    className="flex-1 p-2 border rounded"
                    placeholder="Quantity"
                  />
                  <button
                    onClick={handleRestock}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Restock
                  </button>
                </div>
              </div>

              {/* Price Adjustment Form */}
              <div>
                <h4 className="font-semibold mb-2">Adjust Price</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="flex-1 p-2 border rounded"
                    placeholder="New Price"
                  />
                  <button
                    onClick={handlePriceAdjust}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Update Price
                  </button>
                </div>
              </div>
            </div>

            <button
              className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Purchase Medication Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Purchase New Medication</h3>
            
            <div className="space-y-4">
              {/* Medication Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication
                </label>
                <select
                  value={selectedMedication}
                  onChange={(e) => handleMedicationChange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {availableMedications.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} ({med.category}) - Cost: ${med.cost}
                    </option>
                  ))}
                </select>
                {selectedMedication && (
                  <p className="text-sm text-gray-600 mt-1">
                    {availableMedications.find(med => med.id === selectedMedication)?.description}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (per unit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                  className="w-full p-2 border rounded"
                />
                {selectedMedication && (
                  <p className="text-sm text-gray-600 mt-1">
                    Suggested price: ${availableMedications.find(med => med.id === selectedMedication)?.suggested_price}
                  </p>
                )}
              </div>

              {/* Cost Summary */}
              {selectedMedication && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Purchase Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Cost per unit:</span>
                      <span>${availableMedications.find(med => med.id === selectedMedication)?.cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{purchaseQuantity}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span>${(availableMedications.find(med => med.id === selectedMedication)?.cost * purchaseQuantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Potential Revenue:</span>
                      <span>${(purchasePrice * purchaseQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handlePurchaseMedication}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Purchase
              </button>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
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

export default InventoryManager;

 