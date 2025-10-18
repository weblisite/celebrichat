import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base = 'btn';
    const variantClass =
      variant === 'primary'
        ? 'btn-primary'
        : variant === 'secondary'
        ? 'bg-muted hover:bg-muted/80'
        : variant === 'outline'
        ? 'border border-foreground/20 hover:bg-foreground/5'
        : 'hover:bg-foreground/5';

    const sizeClass =
      size === 'sm' ? 'h-8 px-3 text-xs' : size === 'lg' ? 'h-11 px-6 text-base' : 'h-10';

    return (
      <button ref={ref} className={cn(base, variantClass, sizeClass, className)} {...props} />
    );
  }
);
Button.displayName = 'Button';
