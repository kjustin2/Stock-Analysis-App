import React, { useState, useEffect, useRef, useCallback } from 'react';
import { stockDataService } from '../services/stockDataService';

interface SmartStockSearchProps {
  onSearch: (symbol: string) => void;
  currentSymbol: string;
  loading?: boolean;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  type?: string;
}

const SmartStockSearch: React.FC<SmartStockSearchProps> = ({
  onSearch,
  currentSymbol,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Popular stocks for quick access
  const popularStocks: StockSuggestion[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('stockSearchHistory');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse search history:', e);
      }
    }
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('stockSearchHistory');
    const savedFavorites = localStorage.getItem('stockFavorites');
    
    if (savedHistory) {
      try {
        setRecentSearches(JSON.parse(savedHistory));
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
    
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.warn('Failed to load favorites:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((symbol: string) => {
    const updatedHistory = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 10);
    setRecentSearches(updatedHistory);
    localStorage.setItem('stockSearchHistory', JSON.stringify(updatedHistory));
  }, [recentSearches]);

  // Favorites management
  const toggleFavorite = useCallback((symbol: string) => {
    const updatedFavorites = favorites.includes(symbol)
      ? favorites.filter(s => s !== symbol)
      : [...favorites, symbol].slice(0, 20); // Limit to 20 favorites
    
    setFavorites(updatedFavorites);
    localStorage.setItem('stockFavorites', JSON.stringify(updatedFavorites));
  }, [favorites]);

  const isFavorite = useCallback((symbol: string) => {
    return favorites.includes(symbol);
  }, [favorites]);

  // Debounced validation and suggestions
  const debouncedValidation = useCallback(async (value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      setValidationResult('unknown');
      return;
    }

    const normalizedValue = value.trim().toUpperCase();
    
    // Filter favorites, popular stocks and recent searches
    const matchingSuggestions: StockSuggestion[] = [];
    
    // Add favorites that match (highest priority)
    favorites
      .filter(symbol => symbol.includes(normalizedValue))
      .forEach(symbol => {
        matchingSuggestions.push({ symbol, name: '⭐ Favorite', type: 'favorite' });
      });
    
    // Add popular stocks that match
    popularStocks
      .filter(stock => 
        stock.symbol.includes(normalizedValue) || 
        stock.name.toLowerCase().includes(value.toLowerCase())
      )
      .forEach(stock => {
        if (!matchingSuggestions.find(s => s.symbol === stock.symbol)) {
          matchingSuggestions.push({...stock, type: 'popular'});
        }
      });
    
    // Add recent searches that match
    recentSearches
      .filter(symbol => symbol.includes(normalizedValue))
      .forEach(symbol => {
        if (!matchingSuggestions.find(s => s.symbol === symbol)) {
          matchingSuggestions.push({ symbol, name: '🕒 Recent Search', type: 'recent' });
        }
      });

    setSuggestions(matchingSuggestions.slice(0, 8));

    // Basic validation for stock symbol format
    const isValidFormat = /^[A-Z]{1,5}$/.test(normalizedValue);
    if (isValidFormat) {
      setIsValidating(true);
      try {
        // Try to fetch basic info to validate symbol exists
        const stockInfo = await stockDataService.getStockInfo(normalizedValue);
        setValidationResult(stockInfo ? 'valid' : 'invalid');
      } catch (error) {
        setValidationResult('invalid');
      } finally {
        setIsValidating(false);
      }
    } else {
      setValidationResult(normalizedValue.length > 0 ? 'invalid' : 'unknown');
    }
  }, [recentSearches]);

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      debouncedValidation(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: StockSuggestion) => {
    setInputValue(suggestion.symbol);
    setShowSuggestions(false);
    saveToHistory(suggestion.symbol);
    onSearch(suggestion.symbol);
  };

  // Handle search execution
  const handleSearch = () => {
    const symbol = inputValue.trim().toUpperCase();
    if (symbol) {
      saveToHistory(symbol);
      onSearch(symbol);
      setShowSuggestions(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getValidationIcon = () => {
    if (isValidating) return '⏳';
    if (validationResult === 'valid') return '✅';
    if (validationResult === 'invalid') return '❌';
    return '';
  };

  const getValidationMessage = () => {
    if (isValidating) return 'Validating symbol...';
    if (validationResult === 'valid') return 'Valid stock symbol';
    if (validationResult === 'invalid') return 'Symbol not found or invalid format';
    return '';
  };

  return (
    <div className="smart-search-container" style={{ position: 'relative', width: '100%' }}>
      <div className="search-input-wrapper" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 45px 12px 16px',
            fontSize: '16px',
            border: `2px solid ${
              validationResult === 'valid' ? '#28a745' :
              validationResult === 'invalid' ? '#dc3545' : '#e0e0e0'
            }`,
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
        />
        
        {/* Validation indicator */}
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '14px'
        }}>
          {getValidationIcon()}
        </div>

        {/* Clear button */}
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              setSuggestions([]);
              setValidationResult('unknown');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: '35px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#666',
              padding: '2px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Validation message */}
      {getValidationMessage() && (
        <div style={{
          fontSize: '12px',
          color: validationResult === 'valid' ? '#28a745' : 
                 validationResult === 'invalid' ? '#dc3545' : '#666',
          marginTop: '4px',
          marginLeft: '4px'
        }}>
          {getValidationMessage()}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="suggestions-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.symbol}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div 
                onClick={() => handleSuggestionClick(suggestion)}
                style={{ 
                  flex: 1, 
                  cursor: 'pointer' 
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {suggestion.symbol}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  {suggestion.name}
                </div>
              </div>
              
              {/* Favorite toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(suggestion.symbol);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px',
                  marginLeft: '8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={isFavorite(suggestion.symbol) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite(suggestion.symbol) ? '⭐' : '☆'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions Row */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '12px',
        flexWrap: 'wrap' 
      }}>
        {/* Search button */}
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading || !inputValue.trim()}
          style={{
            flex: '2',
            minWidth: '200px',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: loading || !inputValue.trim() ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Stock'}
        </button>

        {/* Favorites toggle button */}
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: showFavorites ? '#ffc107' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          title="Show/hide favorites"
        >
          ⭐ Favorites ({favorites.length})
        </button>
      </div>

      {/* Favorites section */}
      {showFavorites && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#495057'
          }}>
            ⭐ Your Favorites {favorites.length > 0 && `(${favorites.length})`}
          </div>
          
          {favorites.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: '6px'
            }}>
              {favorites.map((symbol) => (
                <div
                  key={symbol}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    fontSize: '12px'
                  }}
                >
                  <span
                    onClick={() => {
                      setInputValue(symbol);
                      onSearch(symbol);
                      setShowFavorites(false);
                    }}
                    style={{
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#667eea',
                      flex: 1
                    }}
                  >
                    {symbol}
                  </span>
                  <button
                    onClick={() => toggleFavorite(symbol)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#dc3545',
                      padding: '2px'
                    }}
                    title="Remove from favorites"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '12px',
              padding: '12px 0'
            }}>
              No favorites yet. Click the ☆ icon next to any stock to add it to favorites.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartStockSearch; 