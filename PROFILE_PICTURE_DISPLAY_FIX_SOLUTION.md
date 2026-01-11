# Profile Picture Display Issue - Diagnosis & Solution

## Problem Summary
Profile picture uploads successfully but doesn't display in the frontend after upload.

## Diagnosis Results

### ✅ Backend Configuration (CORRECT)
- Files are uploaded to: `backend/uploads/profile-pictures/`
- Database stores correct path: `/uploads/profile-pictures/filename.jpg`
- Static file serving configured: `app.use('/uploads', express.static(...))`
- API returns correct response with image field
- File exists on disk (40.78 KB)

### ✅ Frontend URL Construction (CORRECT)
- `getImageUrl()` properly constructs full URL
- Expected URL: `http://localhost:3001/uploads/profile-pictures/filename.jpg`
- URL construction logic is correct

### ⚠️ Potential Issue Areas

#### 1. Component Data Flow
The `ProfilePictureUpload` component might be using stale data after upload:

**Current flow:**
1. Upload completes → `ProfileAPI.uploadProfilePicture()` returns response
2. `onUpdate(response.user)` is called
3. `handleProfileUpdate(updatedUser)` updates `profileData` state
4. Component should re-render with new data

**Potential issue:**
- Component might not be re-rendering with updated `profileData`
- Component might be using `user` from AuthContext instead of `profileData`

#### 2. State Management
In `account/page.tsx` line 292:
```tsx
<ProfilePictureUpload user={profileData || user} language={language} onUpdate={onUpdate} />
```

This should use `profileData` first, but there might be:
- Timing issue where `profileData` is null initially
- Component not re-rendering after `profileData` update
- AuthContext `user` overriding `profileData`

#### 3. Image Loading Issues
Even if URL is correct, image might not display due to:
- Browser caching old image
- CORS errors
- CSS issues (z-index, display, object-fit)
- Network errors (404, 403, 500)

## Solutions

### Solution 1: Ensure Component Uses Updated Data (RECOMMENDED)

**File:** `frontend/src/app/account/page.tsx`

**Change line 292:**
```tsx
// BEFORE
<ProfilePictureUpload user={profileData || user} language={language} onUpdate={onUpdate} />

// AFTER
<ProfilePictureUpload 
  user={profileData || user} 
  language={language} 
  onUpdate={handleProfileUpdate} 
  key={profileData?.image || user?.image} // Force re-render when image changes
/>
```

**Why:** Adding a `key` prop based on the image URL forces React to re-render the component when the image changes.

### Solution 2: Improve State Update Flow

**File:** `frontend/src/app/account/page.tsx`

**Modify `handleProfileUpdate` function (lines 56-60):**
```tsx
const handleProfileUpdate = (updatedUser: UserProfile) => {
  console.log('[AccountPage] Profile updated:', updatedUser);
  setProfileData(updatedUser);
  // Also update AuthContext user state to prevent logout on refresh
  updateUser(updatedUser as unknown as any);
  // Force re-render by updating a timestamp
  setUpdateTimestamp(Date.now());
};
```

**Add state variable:**
```tsx
const [updateTimestamp, setUpdateTimestamp] = useState<number>(Date.now());
```

**Pass timestamp to component:**
```tsx
<ProfilePictureUpload 
  user={profileData || user} 
  language={language} 
  onUpdate={handleProfileUpdate}
  key={updateTimestamp} // Force re-render on update
/>
```

### Solution 3: Debug Image Loading

**File:** `frontend/src/components/profile/ProfilePictureUpload.tsx`

**Add debugging to the image rendering (lines 127-143):**
```tsx
{preview ? (
  <img
    src={preview}
    alt="Preview"
    className="w-full h-full object-cover"
    onError={(e) => console.error('[ProfilePictureUpload] Preview image error:', e)}
  />
) : getImageUrl(user.image) ? (
  <img
    src={getImageUrl(user.image)!}
    alt={user.firstName}
    className="w-full h-full object-cover"
    onError={(e) => {
      console.error('[ProfilePictureUpload] Image load error:', e);
      console.error('[ProfilePictureUpload] Image URL:', getImageUrl(user.image));
    }}
    onLoad={() => {
      console.log('[ProfilePictureUpload] Image loaded successfully');
    }}
  />
) : (
  <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white text-4xl font-bold">
    {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
  </div>
)}
```

### Solution 4: Clear Browser Cache

**After upload, force browser to reload image:**

**File:** `frontend/src/lib/utils/image.ts`

**Modify `getImageUrl` function:**
```tsx
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construct full URL from backend base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const BASE_URL = API_BASE_URL.replace('/api/v1', '');
  
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  return `${BASE_URL}${imagePath}?t=${timestamp}`;
};
```

**Note:** This adds a cache-busting parameter to force browser to reload the image.

### Solution 5: Verify Backend Static File Serving

**File:** `backend/index.js`

**Ensure static file serving is configured (line 104):**
```javascript
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**This is already correct in the code.**

## Testing Steps

### 1. Manual Testing
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to account page
4. Upload a profile picture
5. Look for image request:
   - URL: `http://localhost:3001/uploads/profile-pictures/filename.jpg`
   - Status: Should be 200 OK
6. Check Console tab for errors
7. Check Elements tab to see if `<img>` tag is rendered with correct `src`

### 2. Use Debug Tool
1. Open: `http://localhost:3000/account/profile-picture-debug.html`
2. Click "Test Image URL" button
3. Check if image preview loads
4. Follow instructions on the page

### 3. Check Backend Logs
1. Look at backend console for any errors
2. Check if static file requests are logged
3. Verify no 404 errors for `/uploads/*`

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|----------|-----|
| Image not loading (404) | Network tab shows 404 | Check backend is running on port 3001 |
| CORS error | Console shows CORS error | Check CORS configuration in backend |
| Image loads but not visible | Image element exists but not visible | Check CSS (z-index, display, object-fit) |
| Stale image after upload | Old image still shows | Add cache-busting timestamp to URL |
| Component not re-rendering | New image in DB but not shown | Add key prop to force re-render |
| State not updating | profileData not updated after upload | Check onUpdate callback and state updates |

## Verification Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] File exists in `backend/uploads/profile-pictures/`
- [ ] Database has correct image path
- [ ] API returns image in response
- [ ] Frontend constructs correct URL
- [ ] Image loads in browser (test URL directly)
- [ ] No CORS errors in console
- [ ] No JavaScript errors in console
- [ ] Component re-renders after upload
- [ ] Image displays in component

## Recommended Implementation Order

1. **First:** Add debugging to ProfilePictureUpload component (Solution 3)
2. **Second:** Add key prop to force re-render (Solution 1)
3. **Third:** Improve state update flow (Solution 2)
4. **Fourth:** Add cache-busting if needed (Solution 4)
5. **Finally:** Test thoroughly using debug tool and manual testing

## Files Modified

1. `frontend/src/app/account/page.tsx` - Component key and state management
2. `frontend/src/components/profile/ProfilePictureUpload.tsx` - Debug logging
3. `frontend/src/lib/utils/image.ts` - Cache-busting (optional)

## Summary

The backend configuration is correct. The issue is likely in the frontend component's data flow or rendering. The most common causes are:

1. Component not re-rendering with updated data
2. Component using stale data from AuthContext
3. Browser caching old image
4. Image loading errors not being caught

Implement the solutions in order, starting with debugging to identify the exact issue, then apply the appropriate fix.
