/**
 * Image URL Utility Functions
 * 
 * Helper functions for constructing image URLs from backend paths
 */

/**
 * Constructs a full image URL from a backend path
 * @param imagePath - The image path from backend (e.g., "/uploads/profile-pictures/file.jpg")
 * @returns Full URL or null if imagePath is falsy
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // For /uploads paths, use relative URL to leverage Next.js rewrites
  // This avoids CORS issues by proxying through the frontend
  if (imagePath.startsWith('/uploads/')) {
    // Add cache-busting timestamp to prevent browser caching
    const timestamp = Date.now();
    return `${imagePath}?t=${timestamp}`;
  }
  
  // For other paths, construct full URL from backend base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const BASE_URL = API_BASE_URL.replace('/api/v1', '');
  
  // Add cache-busting timestamp to prevent browser caching
  const timestamp = Date.now();
  return `${BASE_URL}${imagePath}?t=${timestamp}`;
};

/**
 * Constructs a full image URL with fallback
 * @param imagePath - The image path from backend
 * @param fallback - Fallback URL or value to return if imagePath is falsy
 * @returns Full URL or fallback
 */
export const getImageUrlWithFallback = (
  imagePath: string | null | undefined,
  fallback: string
): string => {
  return getImageUrl(imagePath) || fallback;
};

/**
 * Checks if an image URL is valid
 * @param url - The URL to check
 * @returns true if URL appears valid
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};
