import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import styled from 'styled-components';
import type { CandleData } from '../services/api';

const ChartWrapper = styled.div<{ isExpanded: boolean }>`
  width: 100%;
  height: ${props => props.isExpanded ? '100vh' : '100%'};
  position: ${props => props.isExpanded ? 'fixed' : 'relative'};
  top: ${props => props.isExpanded ? '0' : 'auto'};
  left: ${props => props.isExpanded ? '0' : 'auto'};
  right: ${props => props.isExpanded ? '0' : 'auto'};
  bottom: ${props => props.isExpanded ? '0' : 'auto'};
  background: white;
  min-height: ${props => props.isExpanded ? '100vh' : '700px'};
  padding: ${props => props.isExpanded ? '2rem' : '1rem'};
  box-sizing: border-box;
  z-index: ${props => props.isExpanded ? '1000' : '0'};
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;

  &:hover {
    box-shadow: ${props => !props.isExpanded ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'};
  }
`;

const ChartElement = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  box-sizing: border-box;
  height: 100%;
  z-index: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
`;

const ExpandButton = styled.button<{ isExpanded: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  padding: 0.75rem 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    opacity: 1;
    background: #1565c0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '${props => props.isExpanded ? '↙' : '↗'}';
    font-size: 1.2rem;
  }
`;

const Overlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.3s, visibility 0.3s;
`;

interface StockChartProps {
  data: CandleData[];
  isLoading?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({ data, isLoading }) => {
  const chartElementRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chart, setChart] = useState<IChartApi | null>(null);

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    // Handle escape key to exit expanded mode
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  useEffect(() => {
    if (chart) {
      const handleResize = () => {
        if (chartElementRef.current) {
          const { clientWidth, clientHeight } = chartElementRef.current;
          chart.applyOptions({
            width: clientWidth,
            height: clientHeight,
          });
          chart.timeScale().fitContent();
        }
      };

      // Delay resize to allow transition to complete
      setTimeout(handleResize, 300);
    }
  }, [isExpanded, chart]);

  useEffect(() => {
    let chartInstance: IChartApi | null = null;
    
    const initChart = () => {
      if (!chartElementRef.current || !data.length) return;

      try {
        // Clear any existing content
        chartElementRef.current.innerHTML = '';

        // Create chart with initial options
        chartInstance = createChart(chartElementRef.current, {
          width: chartElementRef.current.clientWidth,
          height: chartElementRef.current.clientHeight,
          layout: {
            background: { color: '#ffffff' as ColorType },
            textColor: '#333333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          rightPriceScale: {
            borderVisible: true,
            borderColor: '#f0f0f0',
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
            entireTextOnly: true,
          },
          leftPriceScale: {
            visible: false,
          },
          timeScale: {
            borderVisible: true,
            borderColor: '#f0f0f0',
            timeVisible: true,
            secondsVisible: false,
            tickMarkFormatter: (time: any) => {
              try {
                // Assuming time is in YYYY-MM-DD format
                const [year, month, day] = time.split('-').map(Number);
                // JavaScript months are 0-based
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              } catch (error) {
                console.error('Error formatting date:', error, time);
                return '';
              }
            },
            fixLeftEdge: true,
            fixRightEdge: true,
            visible: true,
          },
          crosshair: {
            vertLine: {
              color: '#999',
              width: 1,
              labelVisible: true,
              labelBackgroundColor: '#ffffff',
            },
            horzLine: {
              color: '#999',
              width: 1,
              labelVisible: true,
              labelBackgroundColor: '#ffffff',
            },
          },
        });

        setChart(chartInstance);

        // Create candlestick series
        const series = chartInstance.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });

        // Format and set data
        const formattedData = data.map(item => {
          // Ensure we get YYYY-MM-DD format
          const dateStr = item.date.split('T')[0];
          return {
            time: dateStr,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          };
        });

        console.log('Sample data point:', formattedData[0]);
        series.setData(formattedData);
        
        // Fit the content and add some margin
        chartInstance.timeScale().fitContent();
        chartInstance.timeScale().applyOptions({
          rightOffset: 12,
          barSpacing: 12,
          minBarSpacing: 8,
          visible: true,
          borderVisible: true,
        });

        // Handle window resize
        const handleResize = () => {
          if (chartElementRef.current && chartInstance) {
            const { clientWidth, clientHeight } = chartElementRef.current;
            chartInstance.applyOptions({
              width: clientWidth - 40,
              height: clientHeight - 40,
            });
            chartInstance.timeScale().fitContent();
          }
        };

        window.addEventListener('resize', handleResize);
        // Initial resize
        handleResize();

        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    };

    const cleanup = initChart();

    // Cleanup
    return () => {
      cleanup?.();
      if (chartInstance) {
        chartInstance.remove();
        setChart(null);
      }
    };
  }, [data]);

  return (
    <>
      <Overlay isVisible={isExpanded} onClick={() => setIsExpanded(false)} />
      <ChartWrapper isExpanded={isExpanded}>
        <ExpandButton 
          isExpanded={isExpanded} 
          onClick={(e) => {
            e.stopPropagation();
            handleExpandToggle();
          }}
          aria-label={isExpanded ? 'Minimize chart' : 'Expand chart'}
        >
          {isExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
        </ExpandButton>
        <ChartElement ref={chartElementRef} />
        {isLoading && (
          <LoadingOverlay>
            Loading chart...
          </LoadingOverlay>
        )}
      </ChartWrapper>
    </>
  );
}; 