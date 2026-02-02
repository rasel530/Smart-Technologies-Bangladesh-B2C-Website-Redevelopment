import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../utilities/cn';

export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";
export type CardVariant = "default" | "bordered" | "elevated";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-neutral-200',
  bordered: 'bg-white border-2 border-neutral-300',
  elevated: 'bg-white shadow-md',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'lg', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ title, description, action, className, ...props }: CardHeaderProps) => {
  return (
    <div className={cn('px-6 py-4 border-b border-neutral-200', className)} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export const CardBody = ({ children, className, ...props }: CardBodyProps) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, align = 'right', className, ...props }: CardFooterProps) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-neutral-200 flex gap-3',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
