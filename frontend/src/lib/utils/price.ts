/**
 * Get the correct price to use for a product
 * Handles sale price validation and fallback to regular price
 */
export function getProductPrice(
  salePrice: number | string | null | undefined,
  regularPrice: number | string | undefined,
  fallbackPrice?: number
): number {
  const salePriceNum = salePrice != null ? Number(salePrice) : null;
  const regularPriceNum = regularPrice != null ? Number(regularPrice) : null;
  
  // Use sale price only if it's a valid discount
  const hasValidSalePrice = salePriceNum !== null && 
                           salePriceNum > 0 && 
                           regularPriceNum !== null && 
                           salePriceNum < regularPriceNum;
  
  return hasValidSalePrice ? salePriceNum : (regularPriceNum || fallbackPrice || 0);
}

/**
 * Check if a product has a valid discount
 */
export function hasValidDiscount(
  salePrice: number | string | null | undefined,
  regularPrice: number | string | undefined
): boolean {
  const salePriceNum = salePrice != null ? Number(salePrice) : null;
  const regularPriceNum = regularPrice != null ? Number(regularPrice) : null;
  
  return salePriceNum !== null && 
         salePriceNum > 0 && 
         regularPriceNum !== null && 
         salePriceNum < regularPriceNum;
}
