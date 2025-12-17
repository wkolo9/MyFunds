import { marketApi } from '@/lib/api/market.client';
import type { CandlestickData } from 'lightweight-charts';

export const getCandles = async (ticker: string): Promise<CandlestickData[]> => {
  const candleData = await marketApi.getCandles(ticker);
  
  const sortedData = [...candleData].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  return sortedData.map(d => ({
    time: d.time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));
};
