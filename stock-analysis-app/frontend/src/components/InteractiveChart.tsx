import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createChart, CrosshairMode, LineStyle, ColorType } from 'lightweight-charts';

interface ChartDataPoint {
  x: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface ChartData {
  symbol: string;
  period: string;
  data: ChartDataPoint[];
  data_points: number;
}

interface DrawingTool {
  id: string;
  type: 'trendline' | 'horizontal' | 'vertical' | 'text' | 'fibonacci';
  coordinates: {
    x1: number;
    y1: number;
    x2?: number;
    y2?: number;
  };
  style: {
    color: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
  };
  text?: string;
}

interface InteractiveChartProps {
  chartData: ChartData;
  height?: number;
  showVolume?: boolean;
  enableDrawing?: boolean;
  onDrawingAdd?: (drawing: DrawingTool) => void;
  onDrawingRemove?: (drawingId: string) => void;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  chartData,
  height = 500,
  showVolume = true,
  enableDrawing = true,
  onDrawingAdd,
  onDrawingRemove
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const [drawings, setDrawings] = useState<DrawingTool[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{x: number, y: number} | null>(null);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current || !chartData?.data?.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: '#333',
        background: { type: ColorType.Solid, color: '#ffffff' },
        fontSize: 12,
      },
      width: chartContainerRef.current.clientWidth,
      height: showVolume ? height * 0.7 : height,
      rightPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(224, 227, 235, 0.5)',
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: 'rgba(224, 227, 235, 0.5)',
          style: LineStyle.Dashed,
        },
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.3)',
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series using correct API
    const candlestickSeries = chart.addSeries({
      type: 'Candlestick',
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Convert data for lightweight-charts
    const formattedData = chartData.data.map(point => ({
      time: Math.floor(new Date(point.x).getTime() / 1000),
      open: point.o,
      high: point.h,
      low: point.l,
      close: point.c,
    }));

    candlestickSeries.setData(formattedData);

    // Use correct lightweight-charts API
    const lineSeries = chart.addLineSeries({
      color: '#2196F3',
      lineWidth: 2,
    });

    // For volume, use area series instead of histogram
    if (showVolume) {
      const volumeSeries = chart.addAreaSeries({
        topColor: 'rgba(38, 166, 154, 0.56)',
        bottomColor: 'rgba(38, 166, 154, 0.04)',
        lineColor: 'rgba(38, 166, 154, 1)',
        lineWidth: 2,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      volumeSeriesRef.current = volumeSeries;

      const volumeData = chartData.data.map(point => ({
        time: Math.floor(new Date(point.x).getTime() / 1000),
        value: point.v,
        color: point.c >= point.o ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
      }));

      volumeSeries.setData(volumeData);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Chart interaction handlers for drawing tools
    if (enableDrawing) {
      const handleChartClick = (param: any) => {
        if (!activeDrawingTool || !param.point) return;

        const { x, y } = param.point;
        const time = param.time;
        const price = param.seriesPrices?.get(candlestickSeriesRef.current);

        if (!isDrawing) {
          // Start drawing
          setIsDrawing(true);
          setDrawingStart({ x: time, y: price });
        } else {
          // Finish drawing
          if (drawingStart) {
            const newDrawing: DrawingTool = {
              id: `drawing-${Date.now()}`,
              type: activeDrawingTool as any,
              coordinates: {
                x1: drawingStart.x,
                y1: drawingStart.y,
                x2: time,
                y2: price,
              },
              style: {
                color: '#2196F3',
                lineWidth: 2,
                lineStyle: 'solid',
              },
            };

            setDrawings(prev => [...prev, newDrawing]);
            onDrawingAdd?.(newDrawing);
          }

          setIsDrawing(false);
          setDrawingStart(null);
          setActiveDrawingTool(null);
        }
      };

      chart.subscribeClick(handleChartClick);
    }

    // Fixed crosshair handler - remove unused variables
    chart.subscribeCrosshairMove((param) => {
      if (param.point && param.time) {
        // Handle crosshair movement with time
        console.log('Crosshair at time:', param.time);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData, height, showVolume, enableDrawing, activeDrawingTool, isDrawing, drawingStart]);

  // Drawing tool handlers
  const handleDrawingToolSelect = (tool: string) => {
    setActiveDrawingTool(activeDrawingTool === tool ? null : tool);
    setIsDrawing(false);
    setDrawingStart(null);
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    drawings.forEach(drawing => onDrawingRemove?.(drawing.id));
  };

  const undoLastDrawing = () => {
    if (drawings.length > 0) {
      const lastDrawing = drawings[drawings.length - 1];
      setDrawings(prev => prev.slice(0, -1));
      onDrawingRemove?.(lastDrawing.id);
    }
  };

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Handle pinch-to-zoom start
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Handle pinch-to-zoom
    }
  }, []);

  const drawingTools = [
    { id: 'trendline', name: 'Trend Line', icon: '📈' },
    { id: 'horizontal', name: 'Horizontal Line', icon: '➖' },
    { id: 'vertical', name: 'Vertical Line', icon: '|' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'fibonacci', name: 'Fibonacci', icon: '🌀' },
  ];

  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '12px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>📊 No chart data available</p>
          <p style={{ fontSize: '14px' }}>Please select a stock symbol to view interactive chart</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '15px', 
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    }}>
      {/* Chart Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
          📊 {chartData.symbol} - Interactive Chart
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>{chartData.data_points} points</span>
          <span>•</span>
          <span>{chartData.period.toUpperCase()}</span>
        </div>
      </div>

      {/* Drawing Tools Toolbar */}
      {enableDrawing && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '15px',
          padding: '10px',
          background: '#f8f9fa',
          borderRadius: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
            Drawing Tools:
          </span>
          
          {drawingTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleDrawingToolSelect(tool.id)}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                border: '1px solid #e0e0e0',
                background: activeDrawingTool === tool.id ? '#2196F3' : 'white',
                color: activeDrawingTool === tool.id ? 'white' : '#333',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={tool.name}
            >
              <span>{tool.icon}</span>
              <span className="tool-name" style={{ 
                display: window.innerWidth > 768 ? 'inline' : 'none' 
              }}>
                {tool.name}
              </span>
            </button>
          ))}

          <div style={{ height: '20px', width: '1px', background: '#ddd', margin: '0 5px' }} />

          <button
            onClick={undoLastDrawing}
            disabled={drawings.length === 0}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              border: '1px solid #e0e0e0',
              background: drawings.length > 0 ? 'white' : '#f5f5f5',
              color: drawings.length > 0 ? '#333' : '#999',
              borderRadius: '6px',
              cursor: drawings.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            title="Undo Last Drawing"
          >
            ↶ Undo
          </button>

          <button
            onClick={clearAllDrawings}
            disabled={drawings.length === 0}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              border: '1px solid #e0e0e0',
              background: drawings.length > 0 ? 'white' : '#f5f5f5',
              color: drawings.length > 0 ? '#f44336' : '#999',
              borderRadius: '6px',
              cursor: drawings.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            title="Clear All Drawings"
          >
            🗑️ Clear
          </button>

          {isDrawing && (
            <div style={{
              padding: '6px 10px',
              fontSize: '11px',
              background: '#4CAF50',
              color: 'white',
              borderRadius: '6px',
              animation: 'pulse 1.5s infinite'
            }}>
              🎯 Click to finish drawing
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          height: `${height}px`,
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          cursor: activeDrawingTool ? 'crosshair' : 'default',
          touchAction: 'manipulation', // Improve mobile performance
        }}
      />

      {/* Chart Status */}
      {drawings.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          background: '#e3f2fd',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          🎨 {drawings.length} drawing{drawings.length !== 1 ? 's' : ''} on chart
        </div>
      )}

      {/* Mobile Optimization Styles */}
      <style>{`
        @media (max-width: 768px) {
          .tool-name {
            display: none !important;
          }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default InteractiveChart; 