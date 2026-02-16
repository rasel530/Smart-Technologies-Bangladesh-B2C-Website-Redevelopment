import { CheckoutAddressProvider } from '@/contexts/CheckoutAddressContext';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CheckoutAddressProvider>{children}</CheckoutAddressProvider>;
}
