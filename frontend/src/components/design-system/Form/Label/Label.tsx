import React, { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label = ({ children, className, ...props }: LabelProps) => {
  return (
    <label
      className={`block text-sm font-medium text-neutral-700 mb-1.5 ${className || ''}`}
      {...props}
    >
      {children}
    </label>
  );
};
