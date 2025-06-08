import React, { useState } from 'react';

interface InfoButtonProps {
  title: string;
  content: string;
  className?: string;
}

const InfoButton: React.FC<InfoButtonProps> = ({ title, content, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold hover:bg-blue-600 transition-colors flex items-center justify-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        ?
      </button>
      
      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-2 left-6">
          <div className="font-semibold mb-1">{title}</div>
          <div>{content}</div>
          {/* Arrow */}
          <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default InfoButton; 