import React from 'react';
import InfoButton from '../UI/InfoButton';

interface TimeControlsProps {
  isPaused: boolean;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onTogglePause: () => void;
}

const TimeControls: React.FC<TimeControlsProps> = ({
  isPaused,
  currentSpeed,
  onSpeedChange,
  onTogglePause
}) => {
  const speeds = [1, 2, 3, 5];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Time Controls</h3>
        <InfoButton 
          title="Time Controls"
          content="Control the speed of your pharmacy simulation. Pause to make decisions, or speed up time to see results faster. Higher speeds help you progress through days quickly."
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          className={`px-4 py-2 rounded ${
            isPaused
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          onClick={onTogglePause}
        >
          {isPaused ? 'Play' : 'Pause'}
        </button>
        <div className="flex gap-2">
          {speeds.map(speed => (
            <button
              key={speed}
              className={`px-4 py-2 rounded ${
                currentSpeed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => onSpeedChange(speed)}
              disabled={isPaused}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeControls; 