import React from 'react';
import { useDispatch } from 'react-redux';
import { Notification, removeNotification } from '../../store/gameSlice';

interface NotificationCenterProps {
  notifications: Notification[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications }) => {
  const dispatch = useDispatch();

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications</p>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 border-l-4 rounded ${getNotificationColor(
                notification.type
              )}`}
            >
              <div className="flex justify-between items-start">
                <p className="flex-1">{notification.message}</p>
                <button
                  onClick={() => dispatch(removeNotification(notification.id))}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <p className="text-sm opacity-75 mt-1">
                {formatTimestamp(notification.timestamp)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter; 