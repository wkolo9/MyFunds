import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import type { SectorBreakdownDTO, Currency } from '../../../types';

interface SectorAllocationChartProps {
  data: SectorBreakdownDTO[];
  currency: Currency;
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#8884d8', // Fallback for > 5 sectors
  '#82ca9d',
  '#ffc658',
];

export function SectorAllocationChart({ data, currency }: SectorAllocationChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pl-PL', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'code'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: SectorBreakdownDTO }[] }) => {
    if (active && payload && payload.length) {
      const { sector_name, value, percentage } = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground border border-border p-2 rounded shadow-md text-sm">
          <p className="font-semibold">{sector_name}</p>
          <p>{formatValue(value)}</p>
          <p className="text-muted-foreground">{percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
     return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
            </CardContent>
        </Card>
     )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sector Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map(item => ({ ...item, value: Number(item.value) }))}
                dataKey="value"
                nameKey="sector_name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

