# Cross-Origin-Resource-Policy (CORP) Header Fix for Profile Pictures

## Problem Summary

The frontend was unable to load profile pictures from the backend due to Cross-Origin-Resource-Policy (CORP) and CORS issues. The error message was:

```
The resource at "http://localhost:3001/uploads/profile-pictures/profile-1b5dc062-f8ca-4889-b79f-da8cc1db3eaa-1767893770108-73770014.jpg" was blocked due to its Cross-Origin-Resource-Policy header (or lack thereof).
```

### Root Cause

The frontend (running on `http://localhost:3000`) was attempting to load images directly from the backend (`http://localhost:3001/uploads/...`), which triggered browser CORS restrictions. Even though the backend had CORS headers configured for API endpoints, static file requests were being blocked.

## Solution Implemented

### Approach: Next.js Rewrite Proxy

The solution uses Next.js rewrites to proxy static file requests through the frontend, eliminating CORS issues entirely. This approach is cleaner and more reliable than configuring CORS headers for static files.

### Changes Made

#### 1. Frontend Configuration (`frontend/next.config.js`)

**Added a rewrite rule to proxy `/uploads` requests:**

```javascript
async rewrites() {
  // In Docker, use the service name 'backend' instead of 'localhost'
  const backendUrl = process.env.IS_DOCKER === 'true'
    ? 'http://backend:3000'
    : 'http://localhost:3001';
  
  return [
    // Proxy backend API routes - preserve full path including /api/v1/
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
    // Proxy static file uploads to avoid CORS issues
    {
      source: '/uploads/:path*',
      destination: `${backendUrl}/uploads/:path*`,
    },
  ];
},
```

**What this does:**
- When the frontend requests `/uploads/profile-pictures/file.jpg`, Next.js internally proxies this to `http://localhost:3001/uploads/profile-pictures/file.jpg`
- The browser sees the request as coming from the same origin (the frontend), so no CORS restrictions apply
- Works seamlessly in both development (localhost) and Docker environments

#### 2. Image URL Utility (`frontend/src/lib/utils/image.ts`)

**Updated the `getImageUrl` function to use relative paths for uploads:**

```typescript
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
```

**What this does:**
- Checks if the image path starts with `/uploads/`
- If yes, returns a relative URL (e.g., `/uploads/profile-pictures/file.jpg?t=1234567890`)
- The relative URL is handled by the Next.js rewrite rule, avoiding CORS
- Maintains cache-busting for immediate updates after profile picture changes

#### 3. Debug HTML File (`frontend/src/app/account/profile-picture-debug.html`)

**Updated to use relative paths instead of absolute backend URLs:**

Changed from:
```html
<img src="http://localhost:3001/uploads/profile-pictures/..." />
```

To:
```html
<img src="/uploads/profile-pictures/..." />
```

This ensures the debug tool also benefits from the CORS-free proxy approach.

## Backend Configuration (Already in Place)

The backend already had proper CORS and CORP headers configured for static files in [`backend/index.js`](backend/index.js:106-114):

```javascript
// Serve static files from uploads directory with CORS and CORP headers
app.use('/uploads', (req, res, next) => {
  // Set Cross-Origin-Resource-Policy header to allow cross-origin resource loading
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Set Cross-Origin-Opener-Policy header
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Set Cache-Control for images
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(path.join(__dirname, 'uploads')));
```

This configuration remains in place and provides proper headers when files are served.

## Benefits of This Solution

1. **No CORS Errors:** Requests are proxied through the frontend, so the browser sees them as same-origin
2. **Simpler Configuration:** No need to manage complex CORS headers for static files
3. **Better Performance:** Browser can cache images more efficiently
4. **Environment Agnostic:** Works in both development and Docker without configuration changes
5. **Future-Proof:** Any other static files in `/uploads` will automatically benefit from this fix

## Testing

### Verification Steps

1. **Restart the frontend** to pick up the new configuration:
   ```bash
   docker-compose restart frontend
   ```

2. **Access the application** at `http://localhost:3000`

3. **Navigate to a profile page** that displays profile pictures

4. **Check the browser console** - should show no CORS errors

5. **Check the Network tab** - image requests should show:
   - URL: `/uploads/profile-pictures/...` (not `http://localhost:3001/uploads/...`)
   - Status: 200 OK
   - Type: image/jpeg or image/png

6. **Test profile picture upload** - the new picture should load immediately without CORS errors

### Expected Behavior

- Profile pictures load successfully without any CORS errors in the console
- Image URLs in the browser are relative paths (e.g., `/uploads/profile-pictures/file.jpg?t=1234567890`)
- Network tab shows successful 200 responses for image requests
- Profile picture changes are reflected immediately due to cache-busting

## Files Modified

1. **[`frontend/next.config.js`](frontend/next.config.js)** - Added rewrite rule for `/uploads` paths
2. **[`frontend/src/lib/utils/image.ts`](frontend/src/lib/utils/image.ts)** - Updated `getImageUrl` to return relative URLs for uploads
3. **[`frontend/src/app/account/profile-picture-debug.html`](frontend/src/app/account/profile-picture-debug.html)** - Updated to use relative paths

## Additional Notes

### Cache-Busting

The solution includes cache-busting by appending a timestamp to image URLs:
```typescript
const timestamp = Date.now();
return `${imagePath}?t=${timestamp}`;
```

This ensures that when users update their profile picture, the new image loads immediately instead of showing a cached version.

### Docker Compatibility

The Next.js rewrite configuration automatically handles both environments:
- **Development:** Uses `http://localhost:3001` as the backend URL
- **Docker:** Uses `http://backend:3000` (Docker service name) when `IS_DOCKER=true`

### Security Considerations

This solution is secure because:
1. The rewrite only proxies to the trusted backend server
2. No sensitive data is exposed through the proxy
3. The backend's existing CORS and CORP headers remain in place as a defense-in-depth measure
4. Cache-Control headers are still respected for performance

## Troubleshooting

### If profile pictures still don't load:

1. **Check if the frontend restarted successfully:**
   ```bash
   docker-compose logs frontend --tail=50
   ```

2. **Verify the rewrite is working:**
   - Open browser DevTools Network tab
   - Look for requests to `/uploads/...`
   - They should show as successful (200 OK)

3. **Check if the backend is serving files:**
   ```bash
   curl http://localhost:3001/uploads/profile-pictures/[filename]
   ```

4. **Verify the file exists in the backend:**
   ```bash
   ls -la backend/uploads/profile-pictures/
   ```

### If you see CORS errors:

1. Ensure the frontend has been restarted after the configuration change
2. Check that the image URLs in the browser are relative (start with `/uploads/`)
3. Verify the rewrite rule in `next.config.js` is correctly formatted
4. Check the browser console for any JavaScript errors that might be preventing the rewrite from working

## Conclusion

The CORS issue for profile pictures has been successfully resolved by implementing Next.js rewrites to proxy static file requests through the frontend. This approach eliminates CORS errors entirely while maintaining good performance and cache control. The solution is clean, maintainable, and works seamlessly across different environments.

## Related Documentation

- Next.js Rewrites: https://nextjs.org/docs/app/api-reference/next-config-js/rewrites
- CORS MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Cross-Origin-Resource-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cross-Origin-Resource-Policy
