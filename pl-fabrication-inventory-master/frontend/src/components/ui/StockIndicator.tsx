import type { Component, StockLevel } from '../../types';
import { getStockLevel } from '../../utils/helpers';

interface StockIndicatorProps {
  component: Component;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StockIndicator({ component, showText = true, size = 'md' }: StockIndicatorProps) {
  const level = getStockLevel(component);
  const percentage = Math.min(
    (component.currentStock / component.maxStock) * 100,
    100
  );

  const colors: Record<StockLevel, { bar: string; bg: string; text: string }> = {
    critical: { bar: 'bg-red-500', bg: 'bg-red-500/20', text: 'text-red-400' },
    low: { bar: 'bg-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    adequate: { bar: 'bg-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
    high: { bar: 'bg-blue-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const { bar, bg, text } = colors[level];

  return (
    <div className="flex flex-col gap-1">
      <div className={`w-full ${heights[size]} ${bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${bar} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <div className="flex justify-between text-xs">
          <span className={text}>
            {component.currentStock} / {component.maxStock} {component.unitOfMeasure}
          </span>
          <span className="text-slate-500 capitalize">{level}</span>
        </div>
      )}
    </div>
  );
}

interface StockDotProps {
  level: StockLevel;
  pulse?: boolean;
}

export function StockDot({ level, pulse = false }: StockDotProps) {
  const colors: Record<StockLevel, string> = {
    critical: 'bg-red-500',
    low: 'bg-yellow-500',
    adequate: 'bg-green-500',
    high: 'bg-blue-500',
  };

  return (
    <span className="relative flex h-3 w-3">
      {pulse && level === 'critical' && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[level]} opacity-75`}
        />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[level]}`} />
    </span>
  );
}
