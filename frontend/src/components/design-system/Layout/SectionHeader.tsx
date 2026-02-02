import { HTMLAttributes } from 'react';
import { cn } from '../utilities/cn';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, description, action, className, ...props }: SectionHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)} {...props}>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
