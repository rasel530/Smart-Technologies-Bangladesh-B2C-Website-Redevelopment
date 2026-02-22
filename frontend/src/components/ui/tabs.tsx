'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tabs Component
 * A tabbed interface for organizing content into different views
 */
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const Tabs: React.FC<TabsProps> & {
  List: React.FC<TabListProps>;
  Tab: React.FC<TabProps>;
  Panel: React.FC<TabPanelProps>;
} = ({ defaultValue, value: controlledValue, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabList: React.FC<TabListProps> = ({ children, className }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-x-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ value, children, disabled, className }) => {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error('Tab must be used within a Tabs component');
  }

  const { value: currentValue, onValueChange } = context;
  const isActive = currentValue === value;

  const handleClick = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 border-b-2',
        isActive
          ? 'border-blue-600 text-blue-600 bg-white'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

const TabPanel: React.FC<TabPanelProps> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabPanel must be used within a Tabs component');
  }

  const { value: currentValue } = context;
  const isActive = currentValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={cn('py-4', className)}
    >
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
