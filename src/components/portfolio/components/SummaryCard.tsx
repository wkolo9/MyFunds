import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import type { Currency } from '../../../types';

interface SummaryCardProps {
  totalValue: number;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  isLoading: boolean;
}

export function SummaryCard({
  totalValue,
  currency,
  onCurrencyChange,
  isLoading
}: SummaryCardProps) {
  const formatValue = (value: number, curr: Currency) => {
    return new Intl.NumberFormat(curr === 'USD' ? 'en-US' : 'pl-PL', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
        <div className="flex items-center space-x-1">
          <Button 
            variant={currency === 'USD' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => onCurrencyChange('USD')}
            disabled={isLoading}
          >
            USD
          </Button>
          <Button 
            variant={currency === 'PLN' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => onCurrencyChange('PLN')}
            disabled={isLoading}
          >
            PLN
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            formatValue(totalValue, currency)
          )}
        </div>
      </CardContent>
    </Card>
  );
}

