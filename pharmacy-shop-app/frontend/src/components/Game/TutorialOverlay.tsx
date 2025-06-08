import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { completeTutorial } from '../../store/gameSlice';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string; // Action user should take
}

interface TutorialOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isActive, onComplete }) => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Pharmacy!',
      content: 'Let\'s take a quick tour of your new pharmacy business. You\'ll learn how to manage inventory, compete with other pharmacies, and grow your business.',
      position: 'center'
    },
    {
      id: 'money-display',
      title: 'Your Finances',
      content: 'This shows your current cash. You start with $10,000. Use this money wisely to buy inventory and upgrades.',
      target: '.text-blue-600',
      position: 'bottom'
    },
    {
      id: 'reputation',
      title: 'Reputation Matters',
      content: 'Your reputation affects customer trust and sales. Keep customers happy to maintain a good reputation.',
      target: '.text-green-600',
      position: 'bottom'
    },
    {
      id: 'time-controls',
      title: 'Control Time',
      content: 'Use these controls to play, pause, or speed up time. Click Play to start your business!',
      target: '[data-tutorial="time-controls"]',
      position: 'bottom',
      action: 'Click the Play button'
    },
    {
      id: 'store-status',
      title: 'Open Your Shop',
      content: 'Click this button to open or close your pharmacy. You need to open your shop to start serving customers and making money!',
      target: '[data-tutorial="shop-toggle"]',
      position: 'bottom',
      action: 'Click to open your shop'
    },
    {
      id: 'inventory-tab',
      title: 'Manage Inventory',
      content: 'Click the Inventory tab to purchase your first medications. You start with an empty inventory and need to buy medications to serve customers.',
      target: '[data-tutorial="inventory-tab"]',
      position: 'bottom',
      action: 'Click the Inventory tab'
    },
    {
      id: 'purchase-medications',
      title: 'Purchase Your First Medications',
      content: 'Your inventory is empty! Click "Purchase Medications" to buy your first stock. Start with popular items like Aspirin and Ibuprofen.',
      target: '[data-tutorial="purchase-medications"]',
      position: 'top',
      action: 'Click Purchase Medications'
    },
    {
      id: 'market-tab',
      title: 'Analyze Competition',
      content: 'The Market tab shows competitor prices and market trends. Use this to set competitive prices and stay ahead.',
      target: '[data-tutorial="market-tab"]',
      position: 'bottom'
    },
    {
      id: 'upgrades-tab',
      title: 'Invest in Upgrades',
      content: 'The Upgrades tab lets you improve your pharmacy with better equipment, marketing, and facilities.',
      target: '[data-tutorial="upgrades-tab"]',
      position: 'bottom'
    },
    {
      id: 'notifications',
      title: 'Stay Informed',
      content: 'Watch the notifications area for important updates about your business, low stock alerts, and customer feedback.',
      target: '[data-tutorial="notifications"]',
      position: 'top'
    },
    {
      id: 'competition-goal',
      title: 'Your Main Goal',
      content: 'Your goal is to compete with other pharmacies in your area. Monitor their prices, steal their customers, and become the top pharmacy in town!',
      position: 'center'
    }
  ];

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    if (isActive && currentStepData.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '8px';
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.style.position = '';
        highlightedElement.style.zIndex = '';
        highlightedElement.style.boxShadow = '';
        highlightedElement.style.borderRadius = '';
      }
    };
  }, [currentStep, isActive, currentStepData.target, highlightedElement]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    dispatch(completeTutorial('main-tutorial'));
    onComplete();
  };

  const handleSkip = () => {
    dispatch(completeTutorial('main-tutorial'));
    onComplete();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement || currentStepData.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 280; // Increased to account for buttons
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 20; // Minimum distance from viewport edges

    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'top':
        top = rect.top - tooltipHeight - 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 10;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 10;
        break;
      default:
        top = viewportHeight / 2 - tooltipHeight / 2;
        left = viewportWidth / 2 - tooltipWidth / 2;
    }

    // Ensure tooltip stays within viewport bounds
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    if (top < padding) {
      top = padding;
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return {
      position: 'fixed' as const,
      top: top,
      left: left,
    };
  };

  if (!isActive) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-1000" />
      
      {/* Tutorial Tooltip */}
      <div
        className="bg-white rounded-lg shadow-2xl p-6 max-w-sm z-1002 border-2 border-blue-500"
        style={getTooltipPosition()}
      >
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800">{currentStepData.title}</h3>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {tutorialSteps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-gray-600 mb-4 leading-relaxed">
          {currentStepData.content}
        </p>

        {currentStepData.action && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium text-sm">
              👆 {currentStepData.action}
            </p>
          </div>
        )}

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

          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip Tutorial
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
};

export default TutorialOverlay; 