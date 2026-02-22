'use client';

import React from 'react';
import { AlertTriangle, Lightbulb, CheckCircle, ArrowRight, Package } from 'lucide-react';
import type { OptimizationRecommendation } from '@/lib/api/cartAnalytics';

interface OptimizationRecommendationsProps {
  recommendations: OptimizationRecommendation[];
  language?: 'en' | 'bn';
}

const OptimizationRecommendations: React.FC<OptimizationRecommendationsProps> = ({ 
  recommendations, 
  language = 'en' 
}) => {
  const translations = {
    en: {
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      suggestion: 'Suggestion',
      suggestions: 'Suggestions',
      metrics: 'Metrics',
      affectedProducts: 'Affected Products',
      viewDetails: 'View Details',
      noRecommendations: 'No recommendations at this time',
      allGood: 'Your cart performance looks good!'
    },
    bn: {
      highPriority: 'উচ্চ অগ্রাধিকার',
      mediumPriority: 'মাঝারি অগ্রাধিকার',
      lowPriority: 'নিম্ন অগ্রাধিকার',
      suggestion: 'প্রস্তাবনা',
      suggestions: 'প্রস্তাবনাগুলি',
      metrics: 'মেট্রিক্স',
      affectedProducts: 'প্রভাবিত পণ্যগুলি',
      viewDetails: 'বিস্তারিত দেখুন',
      noRecommendations: 'এই মুহূর্তে কোনো সুপারিশ নেই',
      allGood: 'আপনার কার্ট পারফরম্যান্স ভালো দেখাচ্ছে!'
    }
  };

  const t = translations[language];

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: 'border-red-500 bg-red-50',
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-100 text-red-700',
          icon: AlertTriangle,
          label: t.highPriority
        };
      case 'medium':
        return {
          color: 'border-yellow-500 bg-yellow-50',
          iconColor: 'text-yellow-500',
          badgeColor: 'bg-yellow-100 text-yellow-700',
          icon: Lightbulb,
          label: t.mediumPriority
        };
      case 'low':
        return {
          color: 'border-green-500 bg-green-50',
          iconColor: 'text-green-500',
          badgeColor: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          label: t.lowPriority
        };
      default:
        return {
          color: 'border-gray-500 bg-gray-50',
          iconColor: 'text-gray-500',
          badgeColor: 'bg-gray-100 text-gray-700',
          icon: Lightbulb,
          label: priority
        };
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
        <p className="text-lg font-medium text-gray-700">{t.allGood}</p>
        <p className="text-sm text-gray-500">{t.noRecommendations}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((recommendation, index) => {
        const config = getPriorityConfig(recommendation.priority);
        const Icon = config.icon;

        return (
          <div 
            key={index}
            className={`border-l-4 ${config.color} p-4 rounded-r-lg`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
                <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${config.badgeColor}`}>
                {config.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4">
              {recommendation.description}
            </p>

            {/* Suggestions */}
            {recommendation.suggestions && recommendation.suggestions.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.suggestions}:
                </h5>
                <ul className="space-y-2">
                  {recommendation.suggestions.map((suggestion, sIndex) => (
                    <li key={sIndex} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrics */}
            {recommendation.metrics && Object.keys(recommendation.metrics).length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.metrics}:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(recommendation.metrics).map(([key, value]) => (
                    <div 
                      key={key}
                      className="bg-white px-3 py-1.5 rounded border border-gray-200"
                    >
                      <span className="text-xs text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-sm font-medium ml-1">
                        {typeof value === 'number' ? 
                          (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent') ? 
                            `${value.toFixed(2)}%` : 
                            value.toLocaleString()
                          ) : 
                          value
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Products */}
            {recommendation.affectedProducts && recommendation.affectedProducts.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.affectedProducts}:
                </h5>
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          {language === 'bn' ? 'পণ্য' : 'Product'}
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          {language === 'bn' ? 'স্টক' : 'Stock'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendation.affectedProducts.map((product, pIndex) => (
                        <tr key={pIndex} className="border-t border-gray-100">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-[200px]">
                                {product.productName}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className={`font-medium ${
                              product.stockQuantity < 5 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {product.stockQuantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OptimizationRecommendations;
