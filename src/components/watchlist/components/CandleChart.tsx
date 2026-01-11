import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, type IChartApi, CandlestickSeries } from 'lightweight-charts';
import { getCandles } from '@/lib/commands/get-candles';

interface CandleChartProps {
  ticker: string;
  height?: number;
  colors?: {
    up: string;
    down: string;
    background: string;
    text: string;
  };
}

export const CandleChart: React.FC<CandleChartProps> = ({ 
  ticker, 
  height = 300,
  colors = {
    up: '#22c55e', // green-500
    down: '#ef4444', // red-500
    background: 'transparent',
    text: '#9ca3af', // gray-400
  }
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let mounted = true;
    
    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      localization: {
        locale: 'en-US',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#334155' }, // slate-700
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        visible: true,
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    // 2. Add Series (v5 syntax)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderVisible: false,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });

    chartRef.current = chart;

    // 3. Setup Resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // 4. Fetch and Update Data (using command)
    const loadData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const chartData = await getCandles(ticker);
        
        if (!mounted) return;
console.log(chartData);
        series.setData(chartData);
        chart.timeScale().fitContent();
        setLoading(false);

      } catch (err) {
        console.error(`Failed to fetch candles for ${ticker}`, err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup
    return () => {
      mounted = false;
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []); 

  return (
    <div className="relative w-full h-full">
      {/* Chart is always rendered */}
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px] z-10 pointer-events-none">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
        </div>
      )}
      
      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-sm text-slate-500">
          No data available
        </div>
      )}
    </div>
  );
};
