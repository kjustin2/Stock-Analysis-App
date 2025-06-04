import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { StockChart } from './components/StockChart';
import { AnalysisPanel } from './components/AnalysisPanel';
import { api } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 3600000,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContainer = styled.div`
  max-width: 95vw;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
`;

const Header = styled.header`
  margin-bottom: 20px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  flex: 1;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #1565c0;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(300px, 1fr);
  gap: 20px;
  margin-top: 20px;
  align-items: start;
  position: relative;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  min-height: 600px;
  height: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
`;

const TimeRangeSelector = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  display: flex;
  gap: 8px;
`;

const TimeRangeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid #1976d2;
  border-radius: 4px;
  background: ${props => props.$active ? '#1976d2' : 'white'};
  color: ${props => props.$active ? 'white' : '#1976d2'};
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#1565c0' : '#e3f2fd'};
  }
`;

const AnalysisContainer = styled.div`
  min-width: 0;
  position: relative;
  z-index: 1;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
`;

const LoadingMessage = styled.div`
  color: #1976d2;
  margin-top: 10px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
`;

function StockAnalysisApp() {
  const [symbol, setSymbol] = useState('');
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [timeRange, setTimeRange] = useState(365); // Default to 1 year
  const [chartHeight, setChartHeight] = useState(600);
  const analysisRef = useRef<HTMLDivElement>(null);

  const { 
    data: analysis, 
    error: analysisError, 
    isLoading: analysisLoading,
    isError: isAnalysisError
  } = useQuery({
    queryKey: ['analysis', currentSymbol],
    queryFn: () => api.analyzeStock(currentSymbol),
    enabled: Boolean(currentSymbol),
    retry: 2,
    gcTime: 3600000,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { 
    data: history, 
    error: historyError, 
    isLoading: historyLoading,
    isError: isHistoryError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['history', currentSymbol, timeRange],
    queryFn: () => api.getStockHistory(currentSymbol, timeRange),
    enabled: Boolean(currentSymbol),
    retry: 2,
    gcTime: 3600000,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleSearch = () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (trimmedSymbol) {
      console.log('Setting current symbol:', trimmedSymbol);
      setCurrentSymbol(trimmedSymbol);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    if (currentSymbol) {
      refetchHistory();
    }
  };

  const isLoading = analysisLoading || historyLoading;
  const isError = isAnalysisError || isHistoryError;
  const error = analysisError || historyError;

  // Add effect to update chart height based on analysis panel height
  useEffect(() => {
    const updateChartHeight = () => {
      if (analysisRef.current) {
        const height = analysisRef.current.offsetHeight;
        setChartHeight(Math.max(600, height)); // Minimum height of 600px
      }
    };

    // Initial update
    updateChartHeight();

    // Update on window resize
    window.addEventListener('resize', updateChartHeight);
    
    // Create a mutation observer to watch for changes in the analysis panel
    const observer = new MutationObserver(updateChartHeight);
    if (analysisRef.current) {
      observer.observe(analysisRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', updateChartHeight);
      observer.disconnect();
    };
  }, [analysis]); // Re-run when analysis data changes

  // Log state changes
  useEffect(() => {
    console.log('State update:', {
      currentSymbol,
      isLoading,
      isError,
      hasAnalysis: !!analysis,
      hasHistory: !!history,
      error: error ? (error instanceof Error ? error.message : 'Unknown error') : null
    });
  }, [currentSymbol, isLoading, isError, analysis, history, error]);

  return (
    <AppContainer>
      <Header>
        <h1>Stock Analysis</h1>
      </Header>

      <SearchContainer>
        <Input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter stock symbol (e.g., AAPL)"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !symbol.trim()}
        >
          {isLoading ? 'Loading...' : 'Analyze'}
        </Button>
      </SearchContainer>

      {isLoading && (
        <LoadingMessage>
          Loading data for {currentSymbol}...
        </LoadingMessage>
      )}

      {isError && (
        <ErrorMessage>
          Error: {error instanceof Error ? error.message : 'Failed to fetch data'}
        </ErrorMessage>
      )}

      {currentSymbol && !isError && (
        <MainContent>
          <ChartContainer style={{ height: `${chartHeight}px` }}>
            <TimeRangeSelector>
              <TimeRangeButton 
                $active={timeRange === 365} 
                onClick={() => handleTimeRangeChange(365)}
              >
                1Y
              </TimeRangeButton>
              <TimeRangeButton 
                $active={timeRange === 1095} 
                onClick={() => handleTimeRangeChange(1095)}
              >
                3Y
              </TimeRangeButton>
              <TimeRangeButton 
                $active={timeRange === 1825} 
                onClick={() => handleTimeRangeChange(1825)}
              >
                5Y
              </TimeRangeButton>
            </TimeRangeSelector>
            {history && <StockChart data={history} isLoading={isLoading} />}
          </ChartContainer>
          <AnalysisContainer ref={analysisRef}>
            {analysis && (
              <AnalysisPanel 
                analysis={analysis} 
                isLoading={isLoading}
              />
            )}
          </AnalysisContainer>
        </MainContent>
      )}
    </AppContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StockAnalysisApp />
    </QueryClientProvider>
  );
}
