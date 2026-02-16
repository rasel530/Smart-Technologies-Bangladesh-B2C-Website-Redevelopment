'use client';

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface CartMergeNotificationProps {
  itemsMerged: number;
  itemsSkipped: number;
  onClose: () => void;
  language?: "en" | "bn";
}

export const CartMergeNotification: React.FC<CartMergeNotificationProps> = ({
  itemsMerged,
  itemsSkipped,
  onClose,
  language = "en"
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const messages = {
    en: {
      success: itemsMerged + " item(s) merged successfully",
      partial: itemsSkipped + " item(s) could not be merged",
      title: "Cart Merged",
    },
    bn: {
      success: itemsMerged + " items merged (Bengali)",
      partial: itemsSkipped + " items skipped (Bengali)",
      title: "Cart Merged (Bengali)",
    }
  };

  const iconColor = itemsSkipped > 0 ? "bg-amber-100" : "bg-green-100";

  return (
    <div
      className={"fixed top-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 " + (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-10px]")}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={"p-2 rounded-full " + iconColor}>
          {itemsSkipped > 0 ? (
            <X className="w-5 h-5 text-amber-500" />
          ) : (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {messages[language].title}
          </h3>
          <p className="text-sm text-gray-600">
            {messages[language].success}
          </p>
          {itemsSkipped > 0 && (
            <p className="text-sm text-amber-600">
              {messages[language].partial}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default CartMergeNotification;
