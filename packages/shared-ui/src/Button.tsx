import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
