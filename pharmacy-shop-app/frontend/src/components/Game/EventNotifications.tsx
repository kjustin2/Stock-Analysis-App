import React from 'react';

interface GameEvent {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  timestamp: Date;
  impact: {
    cash?: number;
    reputation?: number;
    inventory?: {
      itemId: string;
      quantity: number;
    }[];
  };
}

const EventNotifications: React.FC = () => {
  // Mock events - in a real implementation, these would come from the game state
  const events: GameEvent[] = [
    {
      id: '1',
      type: 'positive',
      title: 'Local Health Fair',
      description: 'A health fair in your area has increased foot traffic to your pharmacy!',
      timestamp: new Date(),
      impact: {
        reputation: 5,
        cash: 1000,
      },
    },
    {
      id: '2',
      type: 'negative',
      title: 'Supply Chain Disruption',
      description: 'A supplier issue has affected the availability of certain medications.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      impact: {
        inventory: [
          { itemId: 'aspirin', quantity: -50 },
          { itemId: 'ibuprofen', quantity: -30 },
        ],
      },
    },
    {
      id: '3',
      type: 'neutral',
      title: 'Market Price Update',
      description: 'Market prices for common medications have been updated.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      impact: {},
    },
  ];

  const getEventIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'negative':
        return '⚠️';
      case 'neutral':
        return 'ℹ️';
    }
  };

  const getEventColor = (type: GameEvent['type']) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'negative':
        return 'border-red-200 bg-red-50';
      case 'neutral':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Events</h2>

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`border rounded-lg p-4 ${getEventColor(event.type)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getEventIcon(event.type)}</span>
                <span className="font-semibold">{event.title}</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">{event.description}</p>

            {event.impact && (
              <div className="text-sm">
                {event.impact.cash && (
                  <div className={event.impact.cash > 0 ? 'text-green-600' : 'text-red-600'}>
                    Cash: {event.impact.cash > 0 ? '+' : ''}{event.impact.cash}
                  </div>
                )}
                {event.impact.reputation && (
                  <div className={event.impact.reputation > 0 ? 'text-green-600' : 'text-red-600'}>
                    Reputation: {event.impact.reputation > 0 ? '+' : ''}{event.impact.reputation}
                  </div>
                )}
                {event.impact.inventory && event.impact.inventory.length > 0 && (
                  <div className="text-gray-600">
                    Inventory changes:
                    <ul className="list-disc list-inside">
                      {event.impact.inventory.map((item) => (
                        <li key={item.itemId}>
                          {item.itemId}: {item.quantity > 0 ? '+' : ''}{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No recent events to display.
        </div>
      )}
    </div>
  );
};

export default EventNotifications; 