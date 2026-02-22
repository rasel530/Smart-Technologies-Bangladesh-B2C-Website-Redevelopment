'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accordion Component
 * A collapsible section component for organizing content
 */
export interface AccordionProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
  className,
  contentClassName,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Generate a unique ID for the accordion
  const accordionId = typeof title === 'string' 
    ? `accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`
    : `accordion-content-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate content height
  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setContentHeight(contentRef.current.scrollHeight);
      } else {
        setContentHeight(0);
      }
    }
  }, [isOpen]);

  // Handle toggle
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-expanded={isOpen}
        aria-controls={accordionId}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <span
          className={cn(
            'flex-shrink-0 transition-transform duration-200',
            isOpen ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </span>
      </button>

      {/* Content */}
      <div
        id={accordionId}
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? contentHeight : 0 }}
      >
        <div className={cn('px-4 pb-4', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Accordion Group Component
 * Manages multiple accordions with optional single-open behavior
 */
export interface AccordionGroupProps {
  children: React.ReactNode;
  singleOpen?: boolean;
  className?: string;
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({
  children,
  singleOpen = false,
  className
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number, isOpen: boolean) => {
    if (singleOpen) {
      setOpenIndex(isOpen ? index : null);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onToggle: (isOpen: boolean) => handleToggle(index, isOpen),
            defaultOpen: singleOpen ? openIndex === index : child.props.defaultOpen
          });
        }
        return child;
      })}
    </div>
  );
};

export default Accordion;
export { AccordionGroup };
