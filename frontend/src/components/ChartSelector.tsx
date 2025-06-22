import React, { useState, useEffect } from 'react';
import InfoTooltip from './InfoTooltip';

interface ChartSelectorProps {
  onChartTypeChange: (type: 'basic' | 'advanced' | 'interactive') => void;
  onLayoutChange: (layout: 'single' | 'grid' | 'tabs') => void;
  onIndicatorToggle: (indicator: string, enabled: boolean) => void;
  currentChartType: 'basic' | 'advanced' | 'interactive';
  currentLayout: 'single' | 'grid' | 'tabs';
  enabledIndicators: Set<string>;
  isMobile?: boolean;
}

const ChartSelector: React.FC<ChartSelectorProps> = ({
  onChartTypeChange,
  onLayoutChange,
  onIndicatorToggle,
  currentChartType,
  currentLayout,
  enabledIndicators,
  // isMobile = false
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customizationPanel, setCustomizationPanel] = useState<'charts' | 'indicators' | 'layout' | null>(null);

  // Detect mobile viewport
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth <= 768);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const chartTypes = [
    {
      id: 'basic' as const,
      name: 'Basic Chart',
      icon: '📈',
      description: 'Simple line chart with basic interactions',
      recommended: 'Beginners'
    },
    {
      id: 'advanced' as const,
      name: 'Advanced Chart',
      icon: '📊',
      description: 'Candlestick chart with technical indicators',
      recommended: 'Traders'
    },
    {
      id: 'interactive' as const,
      name: 'Interactive Chart',
      icon: '🎨',
      description: 'Full trading chart with drawing tools',
      recommended: 'Professionals'
    }
  ];

  const layoutOptions = [
    {
      id: 'single' as const,
      name: 'Single View',
      icon: '⬜',
      description: 'One large chart view'
    },
    {
      id: 'grid' as const,
      name: 'Grid Layout',
      icon: '⚏',
      description: 'Multiple charts in grid'
    },
    {
      id: 'tabs' as const,
      name: 'Tabbed View',
      icon: '📑',
      description: 'Switch between chart types'
    }
  ];

  const availableIndicators = [
    { id: 'sma_20', name: 'SMA 20', category: 'Moving Averages', description: '20-period Simple Moving Average' },
    { id: 'sma_50', name: 'SMA 50', category: 'Moving Averages', description: '50-period Simple Moving Average' },
    { id: 'ema_12', name: 'EMA 12', category: 'Moving Averages', description: '12-period Exponential Moving Average' },
    { id: 'ema_26', name: 'EMA 26', category: 'Moving Averages', description: '26-period Exponential Moving Average' },
    { id: 'rsi', name: 'RSI', category: 'Momentum', description: 'Relative Strength Index' },
    { id: 'macd', name: 'MACD', category: 'Momentum', description: 'Moving Average Convergence Divergence' },
    { id: 'bollinger', name: 'Bollinger Bands', category: 'Volatility', description: 'Bollinger Bands indicator' },
    { id: 'stochastic', name: 'Stochastic', category: 'Momentum', description: 'Stochastic Oscillator' },
    { id: 'williams_r', name: 'Williams %R', category: 'Momentum', description: 'Williams Percent Range' },
    { id: 'atr', name: 'ATR', category: 'Volatility', description: 'Average True Range' },
  ];

  const indicatorCategories = Array.from(new Set(availableIndicators.map(i => i.category)));

  const CustomizationButton: React.FC<{
    type: string;
    isActive: boolean;
    onClick: () => void;
    icon: string;
    title: string;
  }> = ({ type, isActive, onClick, icon, title }) => (
    <button
      onClick={onClick}
      style={{
        padding: isMobileViewport ? '8px' : '8px 12px',
        fontSize: isMobileViewport ? '10px' : '11px',
        border: '1px solid #e0e0e0',
        background: isActive ? '#667eea' : 'white',
        color: isActive ? 'white' : '#333',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: isMobileViewport ? '2px' : '4px',
        minWidth: isMobileViewport ? 'auto' : '80px',
        justifyContent: 'center'
      }}
      title={title}
    >
      <span>{icon}</span>
      {!isMobileViewport && <span>{type}</span>}
    </button>
  );

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: isMobileViewport ? '12px' : '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e0e0e0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <h4 style={{ 
          margin: 0, 
          color: '#333', 
          fontSize: isMobileViewport ? '14px' : '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          🎛️ Chart Configuration
        </h4>
        
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            border: '1px solid #e0e0e0',
            background: showAdvancedOptions ? '#667eea' : '#f8f9fa',
            color: showAdvancedOptions ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {showAdvancedOptions ? '🔽 Less' : '🔼 More'}
        </button>
      </div>

      {/* Quick Controls */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: showAdvancedOptions ? '16px' : '0',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Chart Type Selection */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ 
            fontSize: isMobileViewport ? '10px' : '11px', 
            fontWeight: 'bold', 
            color: '#666',
            marginRight: '4px'
          }}>
            {isMobileViewport ? 'Type:' : 'Chart Type:'}
          </span>
          {chartTypes.map(chart => (
            <CustomizationButton
              key={chart.id}
              type={chart.name}
              isActive={currentChartType === chart.id}
              onClick={() => onChartTypeChange(chart.id)}
              icon={chart.icon}
              title={`${chart.name} - ${chart.description}`}
            />
          ))}
        </div>

        {/* Quick Indicator Toggles (only on desktop) */}
        {!isMobileViewport && (
          <>
            <div style={{ width: '1px', height: '20px', background: '#e0e0e0', margin: '0 8px' }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>
              Quick:
            </span>
            {['sma_20', 'rsi', 'macd'].map(indicator => (
              <button
                key={indicator}
                onClick={() => onIndicatorToggle(indicator, !enabledIndicators.has(indicator))}
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  border: '1px solid #e0e0e0',
                  background: enabledIndicators.has(indicator) ? '#4CAF50' : 'white',
                  color: enabledIndicators.has(indicator) ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {indicator.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div style={{
          borderTop: '1px solid #f0f0f0',
          paddingTop: '12px'
        }}>
          {/* Customization Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'charts', name: 'Charts', icon: '📊' },
              { id: 'indicators', name: 'Indicators', icon: '📈' },
              { id: 'layout', name: 'Layout', icon: '⚏' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCustomizationPanel(customizationPanel === tab.id ? null : tab.id as any)}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  border: '1px solid #e0e0e0',
                  background: customizationPanel === tab.id ? '#667eea' : 'white',
                  color: customizationPanel === tab.id ? 'white' : '#333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Chart Types Panel */}
          {customizationPanel === 'charts' && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333' }}>Chart Types</h5>
              <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobileViewport ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {chartTypes.map(chart => (
                  <div
                    key={chart.id}
                    onClick={() => onChartTypeChange(chart.id)}
                    style={{
                      padding: '8px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: currentChartType === chart.id ? '#e3f2fd' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{chart.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{chart.name}</span>
                      {currentChartType === chart.id && <span style={{ color: '#1976d2', fontSize: '12px' }}>✓</span>}
                    </div>
                    <p style={{ margin: '0', fontSize: '10px', color: '#666' }}>{chart.description}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#888' }}>
                      Recommended for: {chart.recommended}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indicators Panel */}
          {customizationPanel === 'indicators' && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333' }}>Technical Indicators</h5>
              {indicatorCategories.map(category => (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <h6 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#666', borderBottom: '1px solid #e0e0e0', paddingBottom: '2px' }}>
                    {category}
                  </h6>
                  <div style={{ display: 'grid', gap: '4px', gridTemplateColumns: isMobileViewport ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    {availableIndicators.filter(ind => ind.category === category).map(indicator => (
                      <div
                        key={indicator.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: 'white',
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          flex: 1
                        }}>
                          <input
                            type="checkbox"
                            checked={enabledIndicators.has(indicator.id)}
                            onChange={(e) => onIndicatorToggle(indicator.id, e.target.checked)}
                            style={{ margin: 0 }}
                          />
                          <span>{indicator.name}</span>
                        </label>
                        <InfoTooltip
                          title={indicator.name}
                          content={indicator.description}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Layout Panel */}
          {customizationPanel === 'layout' && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333' }}>Dashboard Layout</h5>
              <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobileViewport ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                {layoutOptions.map(layout => (
                  <div
                    key={layout.id}
                    onClick={() => onLayoutChange(layout.id)}
                    style={{
                      padding: '8px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: currentLayout === layout.id ? '#e8f5e8' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{layout.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>{layout.name}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{layout.description}</div>
                    {currentLayout === layout.id && (
                      <div style={{ marginTop: '4px', color: '#4CAF50', fontSize: '10px' }}>✓ Active</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Quick Actions */}
      {isMobileViewport && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '8px',
          padding: '8px',
          background: '#f8f9fa',
          borderRadius: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '10px', color: '#666', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
            Quick Indicators:
          </span>
          {['sma_20', 'rsi', 'macd', 'bollinger'].map(indicator => (
            <button
              key={indicator}
              onClick={() => onIndicatorToggle(indicator, !enabledIndicators.has(indicator))}
              style={{
                padding: '3px 6px',
                fontSize: '9px',
                border: '1px solid #e0e0e0',
                background: enabledIndicators.has(indicator) ? '#4CAF50' : 'white',
                color: enabledIndicators.has(indicator) ? 'white' : '#333',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {indicator.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartSelector; 