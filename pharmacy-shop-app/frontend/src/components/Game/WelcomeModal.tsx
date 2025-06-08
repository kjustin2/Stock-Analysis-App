import React, { useState, useEffect } from 'react';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTutorial: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onStartTutorial }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const welcomeSteps = [
    {
      title: "Welcome to Pharmacy Business Simulator!",
      content: "You're about to become the owner of your very own pharmacy. Your goal is to build a successful business by managing inventory, setting prices, and keeping customers happy.",
      icon: "🏪"
    },
    {
      title: "Getting Started",
      content: "Start by checking your Dashboard to see your current finances and daily performance. Then visit the Inventory section to stock up on medications that customers need.",
      icon: "📊"
    },
    {
      title: "Key Tips for Success",
      content: "• Monitor market trends to set competitive prices\n• Keep popular medications in stock\n• Invest in upgrades to improve your pharmacy\n• Watch your cash flow and reputation",
      icon: "💡"
    },
    {
      title: "Ready to Begin?",
      content: "Choose how you'd like to start:\n• Take Tutorial - Full guided walkthrough (recommended for new players)\n• Quick Start - Skip tutorial but show key tips\n• Jump In - Start playing immediately",
      icon: "🚀"
    }
  ];

  const currentStepData = welcomeSteps[currentStep];

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('pharmacy-game-tutorial-completed', 'true');
    onClose();
  };

  const handleQuickStart = () => {
    localStorage.setItem('pharmacy-game-tutorial-completed', 'quick-start');
    // Show brief tips instead of full tutorial
    onClose();
  };

  const handleStartTutorial = () => {
    localStorage.setItem('pharmacy-game-tutorial-completed', 'true');
    onStartTutorial();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{currentStepData.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStepData.title}</h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="text-gray-600 text-center mb-8 leading-relaxed whitespace-pre-line">
          {currentStepData.content}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg ${
              currentStep === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {welcomeSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < welcomeSteps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleStartTutorial}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Take Tutorial
              </button>
              <button
                onClick={handleQuickStart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Quick Start
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Jump In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal; 