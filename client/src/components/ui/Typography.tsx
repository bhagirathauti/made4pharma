import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  children,
  className = '',
  ...props
}) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  const styles = {
    1: 'text-4xl font-bold text-gray-900',
    2: 'text-3xl font-bold text-gray-900',
    3: 'text-2xl font-semibold text-gray-900',
    4: 'text-xl font-semibold text-gray-900',
    5: 'text-lg font-medium text-gray-900',
    6: 'text-base font-medium text-gray-900',
  };
  
  return React.createElement(
    Tag,
    { className: `${styles[level]} ${className}`, ...props },
    children
  );
};

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const Text: React.FC<TextProps> = ({
  children,
  size = 'base',
  weight = 'normal',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  return (
    <p className={`text-gray-700 ${sizeStyles[size]} ${weightStyles[weight]} ${className}`} {...props}>
      {children}
    </p>
  );
};

interface MutedTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base';
}

export const MutedText: React.FC<MutedTextProps> = ({
  children,
  size = 'sm',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  };
  
  return (
    <p className={`text-gray-500 ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </p>
  );
};

interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base';
}

export const ErrorText: React.FC<ErrorTextProps> = ({
  children,
  size = 'sm',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  };
  
  return (
    <p className={`text-red-600 ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </p>
  );
};
