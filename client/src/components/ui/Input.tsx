import React, { useEffect, useRef } from 'react';
import { Tooltip } from './Tooltip';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipDisabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  id,
  tooltip: explicitTooltip,
  tooltipPlacement = 'bottom',
  tooltipDisabled = false,
  ...props
}) => {
  const generatedId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputIdRef = useRef<string | null>(null);
  if (!inputIdRef.current) inputIdRef.current = generatedId;
  const inputId = inputIdRef.current;

  // Inject CSS to remove number input spinners for browsers that use pseudo elements.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('no-spin-styles')) return;
    const style = document.createElement('style');
    style.id = 'no-spin-styles';
    style.innerHTML = `
      /* Hide number input spinners for inputs with .no-spin */
      input.no-spin::-webkit-outer-spin-button,
      input.no-spin::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input.no-spin[type=number] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
  }, []);
  
  const baseStyles = 'w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
  const normalStyles = 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const disabledStyles = 'bg-gray-100 cursor-not-allowed opacity-60';
  
  const isNumber = props.type === 'number' || props.type === 'tel' && false;
  const tooltipProp = explicitTooltip;
  // tooltipPlacement and tooltipDisabled are destructured above
  // determine current value to detect emptiness
  const currentVal = (props as any).value ?? (props as any).defaultValue;
  const isEmpty = currentVal === undefined || currentVal === null || (typeof currentVal === 'string' && currentVal.trim() === '');
  // priority: explicit tooltip prop -> if empty show prompt -> show current value -> helperText -> undefined
  const propName = (props as any).name ?? (props as any)['aria-label'] ?? (props as any).placeholder;
  const fieldName = label ?? propName ?? 'field';
  let tooltip: string | undefined;
  // Use explicit tooltip only when a non-empty string is provided.
  if (typeof tooltipProp === 'string' && tooltipProp.trim() !== '') tooltip = tooltipProp;
  else if (isEmpty) tooltip = `Please enter ${fieldName}`;
  else if (currentVal !== undefined && currentVal !== null) tooltip = String(currentVal);
  else tooltip = helperText ?? undefined;

  const tooltipId = !tooltipDisabled && tooltip ? `${inputId}-tooltip` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {(!tooltipDisabled && tooltip) ? (
        <Tooltip content={tooltip} placement={tooltipPlacement} id={tooltipId}>
          <input
            id={inputId}
            className={`${baseStyles} ${error ? errorStyles : normalStyles} ${disabled ? disabledStyles : ''} ${isNumber ? 'no-spin' : ''} ${className}`}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[error ? `${inputId}-error` : null, helperText ? `${inputId}-helper` : null, tooltipId ? tooltipId : null].filter(Boolean).join(' ') || undefined}
            {...props}
          />
        </Tooltip>
      ) : (
        <input
          id={inputId}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${disabled ? disabledStyles : ''} ${isNumber ? 'no-spin' : ''} ${className}`}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[error ? `${inputId}-error` : null, helperText ? `${inputId}-helper` : null].filter(Boolean).join(' ') || undefined}
          {...props}
        />
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
