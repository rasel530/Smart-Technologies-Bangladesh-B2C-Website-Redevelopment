import { HTMLAttributes } from 'react';
import { cn } from '../utilities/cn';

export interface PageWrapperProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const PageWrapper = ({
  title,
  description,
  children,
  actions,
  showBackButton = false,
  onBackClick,
  className,
  ...props
}: PageWrapperProps) => {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Page Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
};
