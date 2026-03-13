import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className = '',
  variant = 'default',
}: MetricCardProps) {
  const variants = {
    default: 'from-slate-800 to-slate-800/50',
    success: 'from-green-900/30 to-green-900/10 border-green-700/30',
    warning: 'from-yellow-900/30 to-yellow-900/10 border-yellow-700/30',
    danger: 'from-red-900/30 to-red-900/10 border-red-700/30',
  };

  const iconColors = {
    default: 'text-slate-400 bg-slate-700/50',
    success: 'text-green-400 bg-green-500/20',
    warning: 'text-yellow-400 bg-yellow-500/20',
    danger: 'text-red-400 bg-red-500/20',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-400';
    if (trend.value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div
      className={`bg-gradient-to-br ${variants[variant]} border border-slate-700 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          
          {(trend || subtitle) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {Math.abs(trend.value)}%
                  {trend.label && <span className="text-slate-500 ml-1">{trend.label}</span>}
                </span>
              )}
              {subtitle && !trend && (
                <span className="text-sm text-slate-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-lg ${iconColors[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
