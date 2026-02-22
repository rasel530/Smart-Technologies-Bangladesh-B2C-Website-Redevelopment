'use client';

import React from 'react';
import { ArrowDown, Users, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';
import type { ConversionFunnel } from '@/lib/api/cartAnalytics';

interface ConversionFunnelChartProps {
  data: ConversionFunnel;
  language?: 'en' | 'bn';
}

const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ data, language = 'en' }) => {
  const { funnel, conversionRates, dropOffPoints } = data;

  const translations = {
    en: {
      views: 'Cart Views',
      adds: 'Items Added',
      checkouts: 'Checkout Started',
      completed: 'Orders Completed',
      conversionRate: 'Conversion Rate',
      dropOff: 'Drop-off',
      stage: 'Stage',
      count: 'Count'
    },
    bn: {
      views: 'কার্ট দেখা',
      adds: 'আইটেম যোগ করা',
      checkouts: 'চেকআউট শুরু',
      completed: 'অর্ডার সম্পন্ন',
      conversionRate: 'রূপান্তর হার',
      dropOff: 'পরিত্যাগ',
      stage: 'ধাপ',
      count: 'সংখ্যা'
    }
  };

  const t = translations[language];

  const stages = [
    {
      key: 'views',
      label: t.views,
      count: funnel.views,
      icon: Users,
      color: 'bg-blue-500',
      rate: 100
    },
    {
      key: 'adds',
      label: t.adds,
      count: funnel.adds,
      icon: ShoppingCart,
      color: 'bg-green-500',
      rate: conversionRates.viewToAdd
    },
    {
      key: 'checkouts',
      label: t.checkouts,
      count: funnel.checkoutInitiated,
      icon: CreditCard,
      color: 'bg-yellow-500',
      rate: conversionRates.addToCheckout
    },
    {
      key: 'completed',
      label: t.completed,
      count: funnel.checkoutCompleted,
      icon: CheckCircle,
      color: 'bg-purple-500',
      rate: conversionRates.checkoutToOrder
    }
  ];

  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const Icon = stage.icon;
        
        return (
          <div key={stage.key} className="relative">
            {/* Funnel Bar */}
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full ${stage.color} flex items-center justify-center text-white shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">{stage.label}</span>
                  <div className="text-right">
                    <span className="font-bold text-lg">{stage.count.toLocaleString()}</span>
                    {index > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({stage.rate.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Drop-off Indicator */}
            {index < stages.length - 1 && dropOffPoints[index] && (
              <div className="flex items-center justify-center my-2">
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <ArrowDown className="w-4 h-4" />
                  <span>{t.dropOff}: {dropOffPoints[index].dropOffRate.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600">{translations[language].conversionRate}</div>
          <div className="text-3xl font-bold text-green-600">
            {conversionRates.overallConversion.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {funnel.checkoutCompleted} / {funnel.views} carts
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionFunnelChart;
