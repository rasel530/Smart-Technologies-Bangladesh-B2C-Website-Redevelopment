/**
 * Custom Next.js Image Loader for Docker Environment
 * 
 * This loader handles the difference between server-side and client-side rendering:
 * - Server-side: Use backend:3000 (Docker internal network)
 * - Client-side: Use localhost:3001 (browser accessible)
 */

export default function imageLoader({ src, width, quality }) {
  // If src is already a full URL, return it as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Replace localhost:3001 with backend:3000 for server-side rendering
    if (typeof window === 'undefined' && src.includes('localhost:3001')) {
      return src.replace('localhost:3001', 'backend:3000');
    }
    return `${src}?w=${width}&q=${quality || 75}`;
  }
  
  // For relative paths, construct the full URL
  // Server-side: use backend:3000
  // Client-side: use localhost:3001
  const baseUrl = typeof window === 'undefined'
    ? 'http://backend:3000'
    : 'http://localhost:3001';
  
  return `${baseUrl}${src}?w=${width}&q=${quality || 75}`;
}
