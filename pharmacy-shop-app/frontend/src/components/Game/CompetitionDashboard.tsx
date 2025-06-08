import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import InfoButton from '../UI/InfoButton';

interface Competitor {
  id: string;
  name: string;
  reputation: number;
  market_share: number;
  customer_satisfaction: number;
  location_distance: number;
  location_area: string;
  prices: { [medication: string]: number };
}

const CompetitionDashboard: React.FC = () => {
  const gameState = useSelector((state: RootState) => state.game);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [marketShare, setMarketShare] = useState(0.12); // Starting market share

  // Mock competitor data
  const mockCompetitors: Competitor[] = [
    {
      id: 'comp_001',
      name: 'HealthMart Pharmacy',
      reputation: 75,
      market_share: 0.25,
      customer_satisfaction: 80,
      location_distance: 0.5,
      location_area: 'Downtown',
      prices: {
        'Aspirin': 9.99,
        'Ibuprofen': 12.99,
        'Acetaminophen': 10.49,
        'Amoxicillin': 21.99,
        'Lisinopril': 26.99
      }
    },
    {
      id: 'comp_002',
      name: 'MediCare Plus',
      reputation: 70,
      market_share: 0.20,
      customer_satisfaction: 75,
      location_distance: 1.2,
      location_area: 'Suburbs',
      prices: {
        'Aspirin': 8.49,
        'Ibuprofen': 11.49,
        'Acetaminophen': 9.99,
        'Amoxicillin': 19.99,
        'Lisinopril': 24.99
      }
    },
    {
      id: 'comp_003',
      name: 'QuickMeds Express',
      reputation: 65,
      market_share: 0.15,
      customer_satisfaction: 70,
      location_distance: 0.8,
      location_area: 'Mall',
      prices: {
        'Aspirin': 7.99,
        'Ibuprofen': 10.99,
        'Acetaminophen': 8.99,
        'Amoxicillin': 18.99,
        'Lisinopril': 23.99
      }
    },
    {
      id: 'comp_004',
      name: 'Family Pharmacy',
      reputation: 80,
      market_share: 0.18,
      customer_satisfaction: 85,
      location_distance: 2.0,
      location_area: 'Residential',
      prices: {
        'Aspirin': 9.49,
        'Ibuprofen': 12.49,
        'Acetaminophen': 10.99,
        'Amoxicillin': 20.99,
        'Lisinopril': 25.99
      }
    }
  ];

  useEffect(() => {
    setCompetitors(mockCompetitors);
  }, []);

  const getCompetitivePosition = () => {
    const sortedCompetitors = [...competitors, {
      id: 'player',
      name: 'Your Pharmacy',
      reputation: gameState.reputation,
      market_share: marketShare,
      customer_satisfaction: gameState.customerSatisfaction,
      location_distance: 0,
      location_area: 'Your Location',
      prices: {}
    }].sort((a, b) => b.market_share - a.market_share);

    const playerPosition = sortedCompetitors.findIndex(c => c.id === 'player') + 1;
    return { position: playerPosition, total: sortedCompetitors.length };
  };

  const getMarketLeader = () => {
    if (competitors.length === 0) {
      return {
        name: 'No Competitors',
        market_share: 0,
        reputation: 0,
        customer_satisfaction: 0
      };
    }
    return competitors.reduce((leader, competitor) => 
      competitor.market_share > leader.market_share ? competitor : leader
    );
  };

  const getClosestCompetitor = () => {
    if (competitors.length === 0) {
      return {
        name: 'No Competitors',
        location_distance: 0,
        market_share: 0,
        reputation: 0
      };
    }
    return competitors.reduce((closest, competitor) => 
      competitor.location_distance < closest.location_distance ? competitor : closest
    );
  };

  const getCompetitiveAdvantages = () => {
    const advantages = [];
    const leader = getMarketLeader();
    
    if (gameState.reputation > leader.reputation) {
      advantages.push('Higher reputation than market leader');
    }
    if (gameState.customerSatisfaction > leader.customer_satisfaction) {
      advantages.push('Better customer satisfaction than market leader');
    }
    
    return advantages;
  };

  const getCompetitiveThreats = () => {
    const threats = [];
    const closest = getClosestCompetitor();
    
    if (closest.market_share > marketShare * 2) {
      threats.push(`${closest.name} has ${(closest.market_share * 100).toFixed(1)}% market share nearby`);
    }
    if (closest.reputation > gameState.reputation) {
      threats.push(`${closest.name} has better reputation in your area`);
    }
    
    return threats;
  };

  const position = getCompetitivePosition();
  const marketLeader = getMarketLeader();
  const advantages = getCompetitiveAdvantages();
  const threats = getCompetitiveThreats();

  return (
    <div className="space-y-6">
      {/* Competition Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Market Competition</h2>
          <InfoButton 
            title="Competition Analysis"
            content="Monitor your competitive position, track competitor prices, and identify opportunities to gain market share. Your goal is to become the #1 pharmacy in your area!"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Your Market Position</h3>
            <p className="text-2xl font-bold text-blue-600">#{position.position}</p>
            <p className="text-sm text-blue-600">out of {position.total} pharmacies</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Market Share</h3>
            <p className="text-2xl font-bold text-green-600">{(marketShare * 100).toFixed(1)}%</p>
            <p className="text-sm text-green-600">of local market</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Market Leader</h3>
            <p className="text-lg font-bold text-purple-600">{marketLeader.name}</p>
            <p className="text-sm text-purple-600">{(marketLeader.market_share * 100).toFixed(1)}% share</p>
          </div>
        </div>

        {/* Competitive Goals */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">🎯 Competitive Goals</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Increase market share to 20% (currently {(marketShare * 100).toFixed(1)}%)</li>
            <li>• Beat {marketLeader.name}'s reputation of {marketLeader.reputation}%</li>
            <li>• Achieve #1 position in local market</li>
            <li>• Maintain competitive pricing vs nearby pharmacies</li>
          </ul>
        </div>

        {/* Competitive Analysis */}
        {advantages.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-green-800 mb-2">✅ Your Advantages</h3>
            <ul className="text-sm text-green-700 space-y-1">
              {advantages.map((advantage, index) => (
                <li key={index}>• {advantage}</li>
              ))}
            </ul>
          </div>
        )}

        {threats.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2">⚠️ Competitive Threats</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {threats.map((threat, index) => (
                <li key={index}>• {threat}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Competitor Details */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Competitor Analysis</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Pharmacy</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-right">Market Share</th>
                <th className="px-4 py-2 text-right">Reputation</th>
                <th className="px-4 py-2 text-right">Customer Satisfaction</th>
                <th className="px-4 py-2 text-right">Distance</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map(competitor => (
                <tr key={competitor.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{competitor.name}</td>
                  <td className="px-4 py-2">{competitor.location_area}</td>
                  <td className="px-4 py-2 text-right">{(competitor.market_share * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{competitor.reputation}%</td>
                  <td className="px-4 py-2 text-right">{competitor.customer_satisfaction}%</td>
                  <td className="px-4 py-2 text-right">{competitor.location_distance.toFixed(1)} mi</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Competitor Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(mockCompetitors[0].prices).map(medication => (
            <div key={medication} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">{medication}</h4>
              <div className="space-y-1 text-sm">
                {competitors.map(competitor => (
                  <div key={competitor.id} className="flex justify-between">
                    <span className="truncate mr-2">{competitor.name.split(' ')[0]}</span>
                    <span className="font-medium">${competitor.prices[medication]?.toFixed(2) || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitionDashboard; 