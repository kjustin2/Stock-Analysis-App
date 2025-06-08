import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import type { RootState } from '../../store';
import type { ChartData, ChartOptions } from 'chart.js';

interface Competitor {
  id: string;
  name: string;
  reputation: number;
  marketShare: number;
  prices: {
    [key: string]: number;
  };
  specialties: string[];
  customerSatisfaction: number;
  location: {
    distance: number;
    area: string;
  };
}

// Mock competitor data - in a real implementation, this would come from the game state
const MOCK_COMPETITORS: Competitor[] = [
  {
    id: '1',
    name: 'HealthMart Pharmacy',
    reputation: 75,
    marketShare: 28,
    prices: {
      'aspirin': 6.99,
      'ibuprofen': 8.99,
      'acetaminophen': 7.49,
      'amoxicillin': 15.99,
      'lisinopril': 12.99,
    },
    specialties: ['Generic Medications', '24/7 Service', 'Drive-through'],
    customerSatisfaction: 82,
    location: {
      distance: 1.2,
      area: 'Downtown',
    },
  },
  {
    id: '2',
    name: 'MediCare Plus',
    reputation: 82,
    marketShare: 35,
    prices: {
      'aspirin': 7.49,
      'ibuprofen': 9.49,
      'acetaminophen': 7.99,
      'amoxicillin': 16.99,
      'lisinopril': 13.49,
    },
    specialties: ['Compounding', 'Specialty Medications', 'Consultation Services'],
    customerSatisfaction: 88,
    location: {
      distance: 0.8,
      area: 'Shopping District',
    },
  },
  {
    id: '3',
    name: 'Value Pharmacy',
    reputation: 65,
    marketShare: 18,
    prices: {
      'aspirin': 5.99,
      'ibuprofen': 7.99,
      'acetaminophen': 6.49,
      'amoxicillin': 14.99,
      'lisinopril': 11.99,
    },
    specialties: ['Low Prices', 'Generic Alternatives', 'Quick Service'],
    customerSatisfaction: 75,
    location: {
      distance: 1.5,
      area: 'Suburban Area',
    },
  },
];

const CompetitorAnalysis: React.FC = () => {
  const { inventory } = useSelector((state: RootState) => state.game);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>(MOCK_COMPETITORS[0].id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Mock market share data
  const marketShareData: ChartData<'line'> = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: MOCK_COMPETITORS.map((competitor) => ({
      label: competitor.name,
      data: [
        competitor.marketShare - Math.random() * 5,
        competitor.marketShare - Math.random() * 3,
        competitor.marketShare + Math.random() * 2,
        competitor.marketShare,
      ],
      borderColor: competitor.id === '1' ? 'rgb(75, 192, 192)' :
                  competitor.id === '2' ? 'rgb(153, 102, 255)' :
                  'rgb(255, 159, 64)',
      tension: 0.1,
    })),
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Market Share %',
        },
      },
    },
  };

  const selectedCompetitorData = MOCK_COMPETITORS.find(c => c.id === selectedCompetitor);

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Market Analysis</h2>
        <div className="h-64">
          <Line data={marketShareData} options={chartOptions} />
        </div>
      </div>

      {/* Competitor Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Competitor Details</h3>
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {MOCK_COMPETITORS.map(competitor => (
              <option key={competitor.id} value={competitor.id}>
                {competitor.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCompetitorData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500">Reputation</h4>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${selectedCompetitorData.reputation}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedCompetitorData.reputation}%
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500">Customer Satisfaction</h4>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${selectedCompetitorData.customerSatisfaction}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedCompetitorData.customerSatisfaction}%
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-sm text-gray-700">
                  {selectedCompetitorData.location.area} ({selectedCompetitorData.location.distance} miles away)
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompetitorData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Price Comparison</h4>
              <div className="space-y-2">
                {Object.entries(selectedCompetitorData.prices).map(([medication, price]) => (
                  <div key={medication} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{medication}</span>
                    <span className="text-sm font-medium">{formatCurrency(price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Total Competitors</h4>
            <p className="text-xl font-semibold">{MOCK_COMPETITORS.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Avg. Customer Satisfaction</h4>
            <p className="text-xl font-semibold">
              {(MOCK_COMPETITORS.reduce((sum, comp) => sum + comp.customerSatisfaction, 0) / MOCK_COMPETITORS.length).toFixed(1)}%
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500">Market Leader</h4>
            <p className="text-xl font-semibold">
              {MOCK_COMPETITORS.reduce((prev, current) => 
                prev.marketShare > current.marketShare ? prev : current
              ).name}
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Tips */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Competition Strategy Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Monitor competitor prices to stay competitive</li>
          <li>• Identify and capitalize on competitor weaknesses</li>
          <li>• Focus on unique services to differentiate your pharmacy</li>
          <li>• Track market share trends to adjust your strategy</li>
        </ul>
      </div>
    </div>
  );
};

export default CompetitorAnalysis; 