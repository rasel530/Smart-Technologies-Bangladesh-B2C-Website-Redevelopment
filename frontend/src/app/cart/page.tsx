import React from 'react';
import { Metadata } from 'next';
import CartPage from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Shopping Cart | Smart Tech',
  description: 'View and manage your shopping cart items',
};

export default function CartPageRoute() {
  return <CartPage />;
}
