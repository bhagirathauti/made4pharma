import React from 'react';

interface StockIndicatorProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  current,
  max,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 50) return 'bg-green-500';
    if (percentage >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Stock Level</span>
          <span className={`text-sm font-semibold ${getTextColor()}`}>
            {current} / {max}
          </span>
        </div>
      )}
      <div className={`w-full ${heights[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${heights[size]} ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
