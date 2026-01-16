import React from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  error,
  disabled,
  className = '',
  id,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      <div className="flex items-center">
        <input
          id={radioId}
          type="radio"
          className={`h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${radioId}-error` : undefined}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className={`ml-2 text-sm font-medium text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p id={`${radioId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
