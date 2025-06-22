import React, { useState, useEffect, useRef, useCallback } from 'react';

interface StockSuggestion {
  symbol: string;
  name: string;
  type: 'popular' | 'recent' | 'suggestion';
}

interface StockSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (symbol: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  popularStocks: string[];
  disabled?: boolean;
}

const StockSearchBox: React.FC<StockSearchBoxProps> = ({
  value,
  onChange,
  onSearch,
  onKeyPress,
  placeholder = "Enter stock symbol (e.g., AAPL, GOOGL, MSFT)",
  popularStocks,
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedRecentSearches = localStorage.getItem('stock-recent-searches');
    if (savedRecentSearches) {
      try {
        const parsed = JSON.parse(savedRecentSearches);
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Save search to recent history
  const saveToRecentSearches = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    const newRecentSearches = [
      upperSymbol,
      ...recentSearches.filter(s => s !== upperSymbol)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('stock-recent-searches', JSON.stringify(newRecentSearches));
  }, [recentSearches]);

  // Generate suggestions based on input
  const generateSuggestions = useCallback((input: string): StockSuggestion[] => {
    if (!input.trim()) {
      // Show recent searches and popular stocks when input is empty
      const recentSuggestions: StockSuggestion[] = recentSearches.map(symbol => ({
        symbol,
        name: 'Recent search',
        type: 'recent'
      }));

      const popularSuggestions: StockSuggestion[] = popularStocks
        .filter(symbol => !recentSearches.includes(symbol))
        .map(symbol => ({
          symbol,
          name: 'Popular stock',
          type: 'popular'
        }));

      return [...recentSuggestions, ...popularSuggestions].slice(0, 8);
    }

    const upperInput = input.toUpperCase();
    const suggestions: StockSuggestion[] = [];

    // Add recent searches that match
    recentSearches
      .filter(symbol => symbol.includes(upperInput))
      .forEach(symbol => {
        suggestions.push({
          symbol,
          name: 'Recent search',
          type: 'recent'
        });
      });

    // Add popular stocks that match
    popularStocks
      .filter(symbol => symbol.includes(upperInput) && !recentSearches.includes(symbol))
      .forEach(symbol => {
        suggestions.push({
          symbol,
          name: 'Popular stock',
          type: 'popular'
        });
      });

    // Add common stock suggestions (simplified list for demonstration)
    const commonStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'AMD', name: 'Advanced Micro Devices' },
      { symbol: 'INTC', name: 'Intel Corporation' },
      { symbol: 'CRM', name: 'Salesforce Inc.' },
      { symbol: 'ADBE', name: 'Adobe Inc.' },
      { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
      { symbol: 'ORCL', name: 'Oracle Corporation' },
      { symbol: 'IBM', name: 'International Business Machines' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' }
    ];

    commonStocks
      .filter(stock => 
        stock.symbol.includes(upperInput) || 
        stock.name.toUpperCase().includes(upperInput)
      )
      .filter(stock => !suggestions.some(s => s.symbol === stock.symbol))
      .forEach(stock => {
        suggestions.push({
          symbol: stock.symbol,
          name: stock.name,
          type: 'suggestion'
        });
      });

    return suggestions.slice(0, 8);
  }, [recentSearches, popularStocks]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const newSuggestions = generateSuggestions(newValue);
    setSuggestions(newSuggestions);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(true);
  };

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 150);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: StockSuggestion) => {
    onChange(suggestion.symbol);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    saveToRecentSearches(suggestion.symbol);
    onSearch(suggestion.symbol);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      onKeyPress(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex]);
        } else {
          onKeyPress(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        onKeyPress(e);
    }
  };

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && suggestionRefs.current[activeSuggestionIndex]) {
      suggestionRefs.current[activeSuggestionIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [activeSuggestionIndex]);

  const getSuggestionIcon = (type: StockSuggestion['type']) => {
    switch (type) {
      case 'recent': return '🕒';
      case 'popular': return '⭐';
      case 'suggestion': return '📈';
      default: return '📈';
    }
  };

  const getSuggestionTypeLabel = (type: StockSuggestion['type']) => {
    switch (type) {
      case 'recent': return 'Recent';
      case 'popular': return 'Popular';
      case 'suggestion': return '';
      default: return '';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.3s',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          color: disabled ? '#999' : '#333',
          ...(showSuggestions && suggestions.length > 0 && {
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
            borderBottomColor: '#f0f0f0'
          })
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#667eea';
          handleInputFocus();
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e0e0e0';
          handleInputBlur();
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: 'white',
            border: '2px solid #f0f0f0',
            borderTop: 'none',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.symbol}-${suggestion.type}`}
              ref={el => { suggestionRefs.current[index] = el; }}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: activeSuggestionIndex === index ? '#f0f4ff' : 'white',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{getSuggestionIcon(suggestion.type)}</span>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    color: '#333'
                  }}>
                    {suggestion.symbol}
                  </div>
                  {suggestion.name !== 'Recent search' && suggestion.name !== 'Popular stock' && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      marginTop: '2px'
                    }}>
                      {suggestion.name}
                    </div>
                  )}
                </div>
              </div>
              {getSuggestionTypeLabel(suggestion.type) && (
                <span style={{
                  fontSize: '10px',
                  color: '#999',
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  {getSuggestionTypeLabel(suggestion.type)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearchBox; 