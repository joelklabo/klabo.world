import * as React from 'react';

type Variant = 'default' | 'outline' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60';

const variants: Record<Variant, string> = {
  default: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-emerald-500',
  outline:
    'border border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-400 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/30',
  ghost: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-900/30',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', variant = 'default', ...props }, ref) => (
  <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
));

Button.displayName = 'Button';
