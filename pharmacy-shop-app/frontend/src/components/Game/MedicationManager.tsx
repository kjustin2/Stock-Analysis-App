import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/gameSlice';

interface Medication {
  id: string;
  name: string;
  generic_name: string | null;
  description: string;
  category: string;
  base_price: number;
  quantity: number;
  price: number;
}

interface MedicationInteraction {
  interacting_drug: string;
  severity: string;
  description: string;
}

interface MedicationDetails extends Medication {
  interactions: MedicationInteraction[];
}

const MedicationManager: React.FC = () => {
  const dispatch = useDispatch();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<MedicationDetails | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const gameState = useSelector((state: RootState) => state.game);

  useEffect(() => {
    fetchCategories();
    fetchMedications();
  }, [selectedCategory, page]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3005/api/medications/categories');
      setCategories(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch medication categories'
      }));
    }
  };

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3005/api/medications', {
        params: {
          category: selectedCategory,
          page,
          limit: 10
        }
      });
      setMedications(response.data.medications);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch medications'
      }));
    } finally {
      setLoading(false);
    }
  };

  const searchMedications = async () => {
    if (!searchQuery.trim()) {
      fetchMedications();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/api/medications/search/${searchQuery}`);
      setMedications(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to search medications'
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicationDetails = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:3005/api/medications/${id}`);
      setSelectedMedication(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch medication details'
      }));
    }
  };

  const syncMedication = async (name: string) => {
    try {
      await axios.post('http://localhost:3005/api/medications/sync', { name });
      dispatch(addNotification({
        type: 'success',
        message: 'Medication synced successfully'
      }));
      fetchMedications();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to sync medication'
      }));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Medication Manager</h2>
      
      {/* Search and Filter */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search medications..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMedications()}
          />
        </div>
        <select
          className="p-2 border rounded"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category} value={cat.category}>
              {cat.category} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Medications List */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Generic Name</th>
              <th className="p-2 text-right">Base Price</th>
              <th className="p-2 text-right">Stock</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map(med => (
              <tr key={med.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{med.name}</td>
                <td className="p-2">{med.generic_name || '-'}</td>
                <td className="p-2 text-right">${med.base_price.toFixed(2)}</td>
                <td className="p-2 text-right">{med.quantity || 0}</td>
                <td className="p-2 text-right">
                  <button
                    className="text-blue-600 hover:text-blue-800 mr-2"
                    onClick={() => fetchMedicationDetails(med.id)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      {/* Medication Details Modal */}
      {selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{selectedMedication.name}</h3>
            <p className="text-gray-600 mb-2">
              Generic Name: {selectedMedication.generic_name || 'N/A'}
            </p>
            <p className="mb-4">{selectedMedication.description}</p>
            
            <div className="mb-4">
              <h4 className="font-bold mb-2">Pricing</h4>
              <p>Base Price: ${selectedMedication.base_price.toFixed(2)}</p>
              <p>Current Stock: {selectedMedication.quantity || 0}</p>
            </div>

            {selectedMedication.interactions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold mb-2">Known Interactions</h4>
                <ul className="space-y-2">
                  {selectedMedication.interactions.map((interaction, index) => (
                    <li key={index} className="p-2 bg-gray-50 rounded">
                      <p className="font-semibold">{interaction.interacting_drug}</p>
                      <p className="text-sm text-gray-600">Severity: {interaction.severity}</p>
                      <p className="text-sm">{interaction.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setSelectedMedication(null)}
            >
              Close
            </button>
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

export default MedicationManager; 