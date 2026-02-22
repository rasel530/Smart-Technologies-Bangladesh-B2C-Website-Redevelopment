'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingCart, Package, ArrowRight } from 'lucide-react';

interface AlreadyRecoveredPageProps {
  message?: string;
}

export function AlreadyRecoveredPage({ message }: AlreadyRecoveredPageProps) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Cart Already Recovered!
      </h1>
      <p className="text-lg text-gray-600 mb-2">
        {message || 'This cart has already been successfully recovered.'}
      </p>
      <p className="text-base text-gray-500 mb-8">
        এই কার্টটি ইতিমধ্যে সফলভাবে পুনরুদ্ধার করা হয়েছে।
      </p>

      {/* Status Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-green-900">Cart Status</h3>
            <p className="text-sm text-green-700">Active and ready for checkout</p>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Your items are saved in your cart</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">You can proceed to checkout anytime</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">All prices and availability are current</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200 text-sm text-green-800">
          <p>✓ আপনার আইটেমগুলো কার্টে সংরক্ষিত আছে</p>
          <p>✓ যেকোনো সময় চেকআউট করতে পারেন</p>
          <p>✓ সমস্ত মূল্য এবং উপলব্ধতা আপডেটেড</p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
        <Link href="/cart">
          <Button size="lg" className="w-full bg-[#006a4e] hover:bg-[#005a3e]">
            <ShoppingCart className="mr-2 w-4 h-4" />
            View Cart
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
        <Link href="/products">
          <Button size="lg" variant="outline" className="w-full">
            <Package className="mr-2 w-4 h-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Additional Info */}
      <div className="text-sm text-gray-500">
        <p className="mb-2">
          If you have any questions about your cart or order, feel free to contact our support team.
        </p>
        <p className="text-gray-400">
          আপনার কার্ট বা অর্ডার সম্পর্কে কোনো প্রশ্ন থাকলে, আমাদের সাপোর্ট টীমের সাথে যোগাযোগ করুন।
        </p>
      </div>

      {/* Support Link */}
      <div className="mt-8">
        <Link href="/contact" className="text-[#006a4e] hover:underline text-sm">
          Contact Support →
        </Link>
      </div>
    </div>
  );
}
