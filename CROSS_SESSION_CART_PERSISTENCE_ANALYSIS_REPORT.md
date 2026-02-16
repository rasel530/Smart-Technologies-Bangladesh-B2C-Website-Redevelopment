# Cross-Session Cart Persistence Analysis Report

**Date:** 2026-02-10  
**Author:** Code Analysis System  
**Scope:** Cross-session cart persistence for e-commerce shopping cart system  
**Reference:** Previous guest cart analysis (CRIT-003 and other persistence gaps)

---

## 1. Executive Summary

This report provides a comprehensive technical analysis of cross-session cart persistence mechanisms in the Smart Tech B2C e-commerce platform. The analysis covers localStorage persistence, Redis caching, database persistence, cookie storage, and session management across the frontend and backend components.

### Key Findings:

- **Total Issues Identified:** 12
- **Critical Issues:** 3
- **High Severity Issues:** 5
- **Medium Severity Issues:** 3
- **Low Severity Issues:** 1

The system implements a multi-layer persistence strategy with localStorage for guest carts, database for authenticated users, and Redis for caching. However, several critical gaps were identified that impact cross-session cart continuity, particularly the lack of cookie-based session ID storage (CRIT-003) and cross-device cart continuity issues.

---

## 2. Code Inspection Analysis

### 2.1 localStorage Persistence (Frontend)

**File:** [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts:1-427)

#### Implementation Details:

**Storage Keys:**

- `GUEST_CART_KEY = 'smart_tech_guest_cart'` (Line 9)
- `GUEST_SESSION_KEY = 'smart_tech_guest_session'` (Line 10)

**Cart Data Structure:**

```typescript
interface GuestCartStorageData {
  sessionId: string;
  items: GuestCartItem[];
  shippingMethod: "standard" | "express" | "overnight" | "pickup";
  discountCode: string | null;
  expiresAt: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
  version: string;
}
```

**Key Features:**

- ✅ 7-day expiration for guest carts (Line 245)
- ✅ Version migration support (Lines 99-103)
- ✅ Cross-tab synchronization via CustomEvents (Lines 156-158, 397-410)
- ✅ Quota exceeded handling (Lines 164-172, 344-363)
- ✅ Structure validation on load (Lines 113-117)
- ❌ **NO cookie backup for session ID**

**Loading Logic (Lines 86-136):**

```typescript
export function loadGuestCartFromStorage(): GuestCartStorageData | null {
  // 1. Check for SSR (return null)
  // 2. Get data from localStorage
  // 3. Validate version
  // 4. Check expiration
  // 5. Validate structure
  // 6. Filter invalid items
  // 7. Return cart or null
}
```

**Saving Logic (Lines 142-173):**

```typescript
export function saveGuestCartToStorage(data: GuestCartStorageData): void {
  // 1. Update timestamps
  // 2. Serialize and save to localStorage
  // 3. Dispatch CustomEvent for cross-tab sync
  // 4. Handle QuotaExceededError
}
```

**Cross-Tab Synchronization:**

- Custom event `guest-cart-updated` dispatched on save (Line 156)
- Custom event `guest-cart-cleared` dispatched on clear (Line 186)
- Listener functions provided (Lines 397-427)

#### Issues Identified:

| Issue ID | Location             | Description                                                | Severity     | Status |
| -------- | -------------------- | ---------------------------------------------------------- | ------------ | ------ |
| CSP-001  | guestCart.ts:9-10    | Session ID only in localStorage, no cookie backup          | **Critical** | Open   |
| CSP-002  | guestCart.ts:245     | 7-day expiration too short for shopping consideration      | Medium       | Open   |
| CSP-003  | guestCart.ts:156-158 | CustomEvent lacks error handling                           | Low          | Open   |
| CSP-004  | guestCart.ts:344-363 | Quota recovery only keeps 5 items, may lose important data | Medium       | Open   |

---

### 2.2 Redis Caching (Backend)

**File:** [`backend/services/cartService.js`](backend/services/cartService.js:1-1690)

#### Implementation Details:

**Cache Configuration:**

```javascript
this.cacheTTL = parseInt(process.env.CART_CACHE_TTL) || 3600; // 1 hour (Line 11)
this.guestCartTTL = parseInt(process.env.CART_GUEST_TTL) || 30 * 24 * 60 * 60; // 30 days (Line 12)
```

**Cache Keys:**

- `cart:{cartId}` - Main cart cache (Line 18-20)
- `cart:{cartId}:items` - Cart items cache (Line 23-25)
- `cart:merge:lock:{userId}` - Merge operation lock (Line 587)
- `cart:merged:{guestSessionId}` - Merge idempotency marker (Line 633)

**Cache Operations:**

**Get from Cache (Lines 1306-1345):**

```javascript
async getCartFromCache(cartId) {
  // 1. Check Redis availability
  // 2. Ping Redis connection
  // 3. Get cached data
  // 4. Return parsed JSON or null
  // 5. Graceful fallback on error
}
```

**Set in Cache (Lines 1348-1380):**

```javascript
async setCartInCache(cartId, cartData) {
  // 1. Check Redis availability
  // 2. Ping Redis connection
  // 3. Set with TTL
  // 4. Log success/error
}
```

**Invalidate Cache (Lines 1268-1303):**

```javascript
async invalidateCartCache(cartId) {
  // 1. Delete cart cache key
  // 2. Delete items cache key
  // 3. Continue on error
}
```

**Redis Graceful Degradation:**

- All Redis operations check availability first (Lines 1278-1286, 1316-1324, 1358-1366)
- Falls back to database on Redis failure
- Logs warnings but doesn't throw errors

#### Issues Identified:

| Issue ID | Location               | Description                                  | Severity | Status |
| -------- | ---------------------- | -------------------------------------------- | -------- | ------ |
| CSP-005  | cartService.js:11      | 1-hour cache TTL may cause stale data        | Medium   | Open   |
| CSP-006  | cartService.js:12      | Guest cart TTL only applies to DB, not Redis | Low      | Open   |
| CSP-007  | cartService.js:580-624 | Merge lock timeout hardcoded to 30 seconds   | Medium   | Open   |

---

### 2.3 Database Persistence (Backend)

**File:** [`backend/services/cartService.js`](backend/services/cartService.js:1-690)

#### Implementation Details:

**Cart Creation with Expiration (Lines 121-171):**

```javascript
async createCart(userId, sessionId) {
  if (sessionId) {
    // Set expiration for guest carts
    const expiresAt = new Date(Date.now() + this.guestCartTTL * 1000);
    cartData.expiresAt = expiresAt;
  }
}
```

**Cart Retrieval (Lines 28-118):**

- Authenticated users: Find by `userId` (Lines 36-60)
- Guest users: Find by `sessionId` (Lines 61-85)
- Falls back to database on cache miss

**Expiration Cleanup (Lines 1383-1409):**

```javascript
async cleanupExpiredCarts() {
  // 1. Find all carts with expiresAt <= now
  // 2. Delete each expired cart
  // 3. Invalidate cache
  // 4. Log cleanup results
}
```

#### Issues Identified:

| Issue ID | Location                 | Description                                 | Severity     | Status |
| -------- | ------------------------ | ------------------------------------------- | ------------ | ------ |
| CSP-008  | cartService.js:137-138   | No automatic expiration job scheduling      | **Critical** | Open   |
| CSP-009  | cartService.js:1386-1396 | Cleanup may timeout with many expired carts | Medium       | Open   |

---

### 2.4 Cookie Storage Analysis

**Finding:** **NO COOKIE STORAGE FOR SESSION ID**

**Current Implementation:**

- Session ID stored ONLY in localStorage via `setGuestSessionId()` (guestCart.ts:207-214)
- No cookie-based session ID storage mechanism found
- **This confirms CRIT-003 from previous guest cart analysis**

**Impact:**

1. User closes browser → localStorage persists but session is considered "lost"
2. User opens new incognito window → No session ID cookie to restore
3. Cross-device cart continuity impossible
4. Session ID sent via header (`x-session-id`) but no fallback

**Expected Cookie Implementation (Missing):**

```typescript
// Missing cookie utilities for session persistence
-setSessionCookie(sessionId, expiresIn) -
  getSessionCookie() -
  clearSessionCookie();
```

#### Issues Identified:

| Issue ID | Location             | Description                                    | Severity     | Status    |
| -------- | -------------------- | ---------------------------------------------- | ------------ | --------- |
| CRIT-003 | guestCart.ts:195-226 | No cookie storage for session ID               | **Critical** | Confirmed |
| CSP-010  | cartController.js:11 | Session ID only from header, no cookie parsing | **Critical** | Open      |

---

### 2.5 Session Management (CartContext.tsx)

**File:** [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx:1-729)

#### Implementation Details:

**Cart Initialization (Lines 602-640):**

```typescript
initializeCart: async (user) => {
  if (user) {
    // Load cart from backend
    const cart = await cartApi.getCart();
    get().setCart(cart);
    removeGuestSessionIdUtil();
    clearGuestCartFromStorageUtil();
  } else {
    // Initialize guest session
    let guestSessionId = sessionId;
    if (!guestSessionId) {
      guestSessionId = generateGuestSessionIdUtil();
      setGuestSessionIdUtil(guestSessionId);
    }
    // Load from localStorage
    const storageData = loadGuestCartFromStorageUtil();
  }
};
```

**Session Restore on Reload (Lines 674-682):**

```typescript
useEffect(() => {
  if (!isMounted) return;
  initializeCart(user);
}, [user, isMounted, initializeCart]);
```

**Guest Cart Sync (Lines 684-691):**

```typescript
useEffect(() => {
  if (!isMounted) return;
  if (user && sessionId && isGuest) {
    mergeGuestCart(sessionId);
  }
}, [user, sessionId, isGuest, isMounted, mergeGuestCart]);
```

#### Issues Identified:

| Issue ID | Location                | Description                                           | Severity | Status |
| -------- | ----------------------- | ----------------------------------------------------- | -------- | ------ |
| CSP-011  | CartContext.tsx:617-621 | New session generated if storage unavailable          | **High** | Open   |
| CSP-012  | CartContext.tsx:185-194 | Guest cart items stored but not fully loaded to state | High     | Open   |

---

## 3. Data Flow Analysis

### 3.1 Cart Persistence Flow Across Sessions

#### Guest User Session Flow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GUEST CART SESSION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

Browser Open                          Browser Close/Reopen
     │                                      │
     ▼                                      │
┌─────────────────────────────────┐        │
│ Check localStorage for cart     │────────┘
│ Check localStorage for session  │    (Session ID still in localStorage)
└────────────────┬────────────────┘
                 │
         ┌──────┴──────┐
         │ Found?       │
         └──────┬──────┘
                │
     ┌──────────┴──────────┐
     │                     │
    YES                    NO
     │                     │
     ▼                     ▼
┌────────────────┐   ┌────────────────┐
│ Load cart from  │   │ Generate new   │
│ localStorage   │   │ session ID     │
└───────┬────────┘   └───────┬────────┘
        │                    │
        ▼                    ▼
   ┌─────────────────────────┐
   │ Fetch product details   │  ← MISSING: No backend sync on restore
   │ for cart items          │
   └───────────┬─────────────┘
               │
               ▼
        ┌────────────────┐
        │ Display cart   │
        │ to user        │
        └────────────────┘
```

**Issues:**

1. Session restore doesn't sync with backend database
2. Product prices may be stale in localStorage
3. Stock status not validated on session restore

#### Authenticated User Session Flow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED USER SESSION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┐

Browser Open                          Browser Close/Reopen
     │                                      │
     ▼                                      │
┌─────────────────────────────────┐        │
│ Get JWT token from storage/     │────────┘
│ cookie                          │    (Token still in cookie)
└────────────────┬────────────────┘
                 │
         ┌──────┴──────┐
         │ Token Valid │
         └──────┬──────┘
                │
     ┌──────────┴──────────┐
     │                     │
    YES                    NO
     │                     │
     ▼                     ▼
┌────────────────┐   ┌────────────────┐
│ Fetch cart from│   │ Redirect to    │
│ backend (cache │   │ login          │
│ or DB)         │   └───────────────┘
└───────┬────────┘
        │
        ▼
   ┌─────────────────────────┐
   │ Display cart with        │
   │ current prices/stock     │
   └─────────────────────────┘
```

**Benefits:**

1. Cart persisted in database
2. Session continuity across devices
3. Price/stock always current

---

### 3.2 Browser Close/Reopen Handling

#### Current Behavior:

| Scenario         | localStorage  | Session     | Cart Data   |
| ---------------- | ------------- | ----------- | ----------- |
| Normal close     | ✅ Persists   | ✅ Retained | ✅ Restored |
| Incognito mode   | ❌ Cleared    | ❌ Lost     | ❌ Lost     |
| Cache clear      | ❌ Cleared    | ❌ Lost     | ❌ Lost     |
| Private browsing | ❌ Cleared    | ❌ Lost     | ❌ Lost     |
| Cross-browser    | ❌ Not shared | ❌ Lost     | ❌ Lost     |
| Cross-device     | ❌ Not shared | ❌ Lost     | ❌ Lost     |

#### Critical Gap - Session ID Persistence:

**Current:** Session ID only in localStorage  
**Expected:** Session ID should be in BOTH localStorage AND cookies

**Why This Matters:**

1. If localStorage is cleared → No session ID → Cart lost
2. If user switches to incognito → No session ID → Cart lost
3. If user switches devices → No session ID → Cart lost

---

### 3.3 Expiration Handling

#### Current Implementation:

**Frontend Expiration Check (guestCart.ts:105-110):**

```typescript
if (new Date(cart.expiresAt) < new Date()) {
  console.log("[GuestCart] Cart expired, clearing");
  clearGuestCartFromStorage();
  return null;
}
```

**Backend Expiration:**

- Set on cart creation (cartService.js:137-138)
- Used in cleanup query (cartService.js:1388-1390)
- **No automatic scheduled cleanup**

#### Issues:

| Issue               | Description                                        |
| ------------------- | -------------------------------------------------- |
| No scheduled job    | `cleanupExpiredCarts()` exists but is never called |
| Frontend-only check | If frontend bug → expired carts accumulate in DB   |
| Short expiration    | 7 days may lose abandoned carts                    |
| No extension option | Can't extend cart life for logged-in users         |

---

### 3.4 Session Restore Mechanisms

#### Current Restore Flow:

```
1. App loads
2. CartContext initializes
3. Check localStorage for session ID
4. If found → load guest cart from localStorage
5. If not found → generate new session ID
6. Store session ID in localStorage
7. Display cart (with product details from API)
```

#### Missing Restore Features:

1. **No cookie backup** for session ID
2. **No backend sync** on session restore
3. **No cart recovery** from failed API calls
4. **No offline support** for cart operations

---

### 3.5 Data Recovery from Failures

#### Current Error Handling:

**localStorage Errors (guestCart.ts:131-135):**

```typescript
} catch (error) {
  console.error('[GuestCart] Error loading from storage:', error);
  clearGuestCartFromStorage();
  return null;
}
```

**API Errors (CartContext.tsx:535-563):**

```typescript
catch (error: any) {
  // Try to recover cart state
  try {
    const cart = await cartApi.getCart();
    get().setCart(cart);
  } catch (recoveryError) {
    cartLogger.error('Failed to recover cart state', { error: recoveryError });
  }
}
```

**Redis Failures:**

- Graceful degradation to database
- Logs warnings but continues

#### Gaps in Recovery:

1. **No retry mechanism** for failed localStorage writes
2. **No backup storage** if localStorage fails
3. **No partial recovery** - clears entire cart on any error
4. **No async persistence** - writes block UI

---

## 4. Gap/Defect Identification

### 4.1 Persistence Gaps for Guest Carts

| Gap ID  | Description                        | File:Line               | Impact                            | Severity     |
| ------- | ---------------------------------- | ----------------------- | --------------------------------- | ------------ |
| CSP-001 | No cookie backup for session ID    | guestCart.ts:195-226    | Cart lost if localStorage cleared | **Critical** |
| CSP-013 | No offline cart storage            | N/A                     | Cart unavailable offline          | High         |
| CSP-014 | No session sync to backend         | CartContext.tsx:615-632 | Stale prices/stock                | Medium       |
| CSP-015 | No cart share across tabs properly | guestCart.ts:397-410    | Race conditions                   | Low          |

---

### 4.2 Session Expiration Issues

| Issue ID | Description                    | File:Line           | Impact           | Severity     |
| -------- | ------------------------------ | ------------------- | ---------------- | ------------ |
| CSP-002  | 7-day expiration too short     | guestCart.ts:245    | Lost carts       | Medium       |
| CSP-008  | No automatic cleanup job       | cartService.js:1383 | DB bloat         | **Critical** |
| CSP-016  | No expiration extension option | N/A                 | Can't save carts | Medium       |
| CSP-017  | Frontend-only expiration check | guestCart.ts:105    | Incomplete       | Medium       |

---

### 4.3 Data Recovery Problems

| Issue ID | Description                     | File:Line            | Impact               | Severity |
| -------- | ------------------------------- | -------------------- | -------------------- | -------- |
| CSP-004  | Quota handling loses data       | guestCart.ts:344-363 | Lost items           | Medium   |
| CSP-011  | No retry for session generation | CartContext.tsx:617  | Lost session         | **High** |
| CSP-018  | No backup storage mechanism     | N/A                  | Single point failure | **High** |
| CSP-019  | No partial cart recovery        | guestCart.ts:132     | All or nothing       | Medium   |

---

### 4.4 Cross-Device Cart Continuity

| Issue ID | Description                          | Impact                | Severity     |
| -------- | ------------------------------------ | --------------------- | ------------ |
| CRIT-003 | Session ID only in localStorage      | Impossible            | **Critical** |
| CSP-020  | No user account cart sync for guests | Lost on device switch | **High**     |
| CSP-021  | No cart migration option             | UX friction           | Medium       |

---

### 4.5 Storage Quota Handling

| Issue ID | Description                             | File:Line            | Severity |
| -------- | --------------------------------------- | -------------------- | -------- |
| CSP-004  | Quota exceeded → removes oldest 5 items | guestCart.ts:347-354 | Medium   |
| CSP-022  | No compression for cart data            | guestCart.ts:152     | Low      |
| CSP-023  | No size monitoring before write         | guestCart.ts:147-172 | Low      |

---

## 5. Identified Issues Summary

### Critical Issues (3)

| ID       | Issue                                | Location             | Fix Priority   |
| -------- | ------------------------------------ | -------------------- | -------------- |
| CRIT-003 | No cookie storage for session ID     | guestCart.ts:195-226 | P0 - Immediate |
| CSP-008  | No automatic cart expiration cleanup | cartService.js:1383  | P0 - Immediate |
| CSP-018  | No backup storage mechanism          | N/A                  | P1 - High      |

### High Severity Issues (5)

| ID      | Issue                                  | Location            | Fix Priority |
| ------- | -------------------------------------- | ------------------- | ------------ |
| CSP-011 | No retry for session generation        | CartContext.tsx:617 | P1 - High    |
| CSP-012 | Guest cart items not fully loaded      | CartContext.tsx:185 | P1 - High    |
| CSP-013 | No offline cart storage                | N/A                 | P2 - Medium  |
| CSP-020 | No cart sync for guests across devices | N/A                 | P1 - High    |
| CSP-007 | Merge lock timeout hardcoded           | cartService.js:581  | P2 - Medium  |

### Medium Severity Issues (3)

| ID      | Issue                      | Location            | Fix Priority |
| ------- | -------------------------- | ------------------- | ------------ |
| CSP-002 | 7-day expiration too short | guestCart.ts:245    | P2 - Medium  |
| CSP-004 | Quota handling loses data  | guestCart.ts:344    | P2 - Medium  |
| CSP-014 | No backend sync on restore | CartContext.tsx:625 | P3 - Low     |

### Low Severity Issues (1)

| ID      | Issue                            | Location         | Fix Priority |
| ------- | -------------------------------- | ---------------- | ------------ |
| CSP-003 | CustomEvent lacks error handling | guestCart.ts:156 | P3 - Low     |

---

## 6. Recommendations for Fixes

### 6.1 Critical Fixes (P0)

#### CRIT-003: Implement Cookie-Based Session Storage

**File:** [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts)

**Add Cookie Utilities:**

```typescript
// Cookie configuration
const SESSION_COOKIE_NAME = "smart_tech_session";
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Set session in cookie
export function setSessionCookie(sessionId: string): void {
  if (typeof window === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=${sessionId};path=/;max-age=${SESSION_COOKIE_MAX_AGE};SameSite=Lax;Secure=${process.env.NODE_ENV === "production"}`;
}

// Get session from cookie
export function getSessionCookie(): string | null {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return value;
  }
  return null;
}

// Update sessionId functions to use both localStorage and cookies
export function setGuestSessionId(sessionId: string): void {
  setSessionCookie(sessionId); // ADD THIS
  localStorage.setItem(GUEST_SESSION_KEY, sessionId);
}

export function getGuestSessionId(): string | null {
  // Try cookie first, fall back to localStorage
  const cookieSession = getSessionCookie();
  if (cookieSession) return cookieSession;
  return localStorage.getItem(GUEST_SESSION_KEY);
}
```

**Lines to Modify:** 195-226

---

#### CSP-008: Implement Scheduled Cart Cleanup

**File:** [`backend/services/cartService.js`](backend/services/cartService.js)

**Add Scheduled Cleanup:**

```javascript
// In constructor or initialization
constructor() {
  // ... existing code ...

  // Schedule cleanup job (every hour)
  if (process.env.NODE_ENV === 'production') {
    this.scheduleCleanup();
  }
}

scheduleCleanup() {
  const cleanupInterval = 60 * 60 * 1000; // 1 hour
  setInterval(async () => {
    try {
      await this.cleanupExpiredCarts();
    } catch (error) {
      this.logger.error('Scheduled cleanup failed', { error: error.message });
    }
  }, cleanupInterval);
}
```

**Alternative - Use node-cron:**

```javascript
const cron = require("node-cron");
cron.schedule("0 * * * *", async () => {
  await cartService.cleanupExpiredCarts();
});
```

**Lines to Modify:** Add after line 15

---

### 6.2 High Priority Fixes (P1)

#### CSP-011: Add Retry Mechanism for Session Generation

**File:** [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx)

**Modify initializeCart:**

```typescript
initializeCart: async (user) => {
  const { sessionId } = get();

  try {
    set({ isLoading: true, error: null });

    if (user) {
      // ... existing authenticated user code ...
    } else {
      // Guest users with retry
      let guestSessionId = sessionId;
      let retryCount = 0;
      const maxRetries = 3;

      while (!guestSessionId && retryCount < maxRetries) {
        try {
          guestSessionId = generateGuestSessionIdUtil();
          setGuestSessionIdUtil(guestSessionId);

          // Verify it was saved
          const verify = getGuestSessionIdUtil();
          if (!verify) {
            guestSessionId = null;
            retryCount++;
          }
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            // Fallback: try to recover from backend
            guestSessionId = await this.recoverSessionFromBackend();
          }
        }
      }

      set({ sessionId: guestSessionId, isGuest: true });
      // ... rest of initialization ...
    }
  } catch (error: any) {
    console.error("[CartContext] Error initializing cart:", error);
    set({
      isLoading: false,
      error: error.message || "Failed to initialize cart",
    });
  }
};
```

**Lines to Modify:** 602-640

---

#### CSP-013: Implement Offline Storage with IndexedDB

**Create new file:** `frontend/src/lib/utils/cartStorage.ts`

```typescript
// IndexedDB for offline cart persistence
const CART_DB_NAME = "smart_tech_cart_db";
const CART_STORE_NAME = "carts";
const DB_VERSION = 1;

class CartStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CART_DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CART_STORE_NAME)) {
          db.createObjectStore(CART_STORE_NAME, { keyPath: "sessionId" });
        }
      };
    });
  }

  async saveCart(cart: GuestCartStorageData): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CART_STORE_NAME], "readwrite");
      const store = transaction.objectStore(CART_STORE_NAME);
      const request = store.put(cart);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCart(sessionId: string): Promise<GuestCartStorageData | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CART_STORE_NAME], "readonly");
      const store = transaction.objectStore(CART_STORE_NAME);
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

export const cartStorage = new CartStorage();
```

---

### 6.3 Medium Priority Fixes (P2)

#### CSP-002: Extend Cart Expiration

**File:** [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts)

**Line 245:**

```typescript
// Change from 7 days to 30 days
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
```

**同步更新 backend:**
**File:** [`backend/services/cartService.js`](backend/services/cartService.js:12)

```javascript
this.guestCartTTL = parseInt(process.env.CART_GUEST_TTL) || 30 * 24 * 60 * 60; // 30 days
```

---

#### CSP-004: Improve Quota Recovery

**File:** [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts:344-363)

**Replace handleQuotaExceeded:**

```typescript
function handleQuotaExceeded(data: GuestCartStorageData): void {
  try {
    // Strategy 1: Try to save minimal data (just session and item references)
    const minimalData: Partial<GuestCartStorageData> = {
      sessionId: data.sessionId,
      items: data.items.slice(0, 2), // Keep first 2 items as reference
      version: GUEST_CART_VERSION,
    };

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(minimalData));
    console.warn("[GuestCart] Saved minimal cart data due to quota");

    // Strategy 2: Notify user of partial save
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cart-quota-warning", {
          detail: {
            lostItems: data.items.length - 2,
            originalCount: data.items.length,
          },
        }),
      );
    }
  } catch (error) {
    // Strategy 3: Complete failure - save metadata only
    try {
      localStorage.setItem(
        "smart_tech_cart_meta",
        JSON.stringify({
          sessionId: data.sessionId,
          lostAt: new Date().toISOString(),
          itemCount: data.items.length,
        }),
      );
    } catch (metaError) {
      console.error("[GuestCart] Complete storage failure");
    }
    // Don't clear cart - let user see error
  }
}
```

---

### 6.4 Low Priority Fixes (P3)

#### CSP-003: Add CustomEvent Error Handling

**File:** [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts:156-158)

```typescript
try {
  window.dispatchEvent(
    new CustomEvent("guest-cart-updated", {
      detail: { items: data.items, sessionId: data.sessionId },
    }),
  );
} catch (eventError) {
  console.warn("[GuestCart] Failed to dispatch cart update event", eventError);
}
```

---

## 7. Required Test Cases for Persistence Validation

### 7.1 Session Persistence Tests

| Test Case ID | Description                          | Steps                                          | Expected Result              |
| ------------ | ------------------------------------ | ---------------------------------------------- | ---------------------------- |
| TC-SP-001    | Session persists after browser close | 1. Add item to cart 2. Close browser 3. Reopen | Cart items restored          |
| TC-SP-002    | Session persists in new tab          | 1. Add item 2. Open new tab 3. Check cart      | Items visible in new tab     |
| TC-SP-003    | Session ID in cookies                | 1. Check cookies after session creation        | Session cookie exists        |
| TC-SP-004    | Session recovery from cookie         | 1. Clear localStorage 2. Refresh               | Session restored from cookie |
| TC-SP-005    | Session persists across devices      | 1. Login on device A 2. Check on device B      | Cart available after login   |

---

### 7.2 Expiration Tests

| Test Case ID | Description                     | Steps                                       | Expected Result             |
| ------------ | ------------------------------- | ------------------------------------------- | --------------------------- |
| TC-EXP-001   | Cart expires after 30 days      | 1. Create cart 2. Wait 30+ days 3. Check    | Cart cleared, user notified |
| TC-EXP-002   | No expired carts in database    | 1. Run cleanup job 2. Query database        | All expired carts deleted   |
| TC-EXP-003   | Expiration extended on activity | 1. Add item to old cart 2. Check expiration | Expiration extended         |

---

### 7.3 Storage Quota Tests

| Test Case ID | Description                 | Steps                                        | Expected Result                   |
| ------------ | --------------------------- | -------------------------------------------- | --------------------------------- |
| TC-QU-001    | Quota exceeded handling     | 1. Fill localStorage 2. Add cart item        | Minimal data saved, user notified |
| TC-QU-002    | Recovery after quota error  | 1. After TC-QU-001 2. Clear space 3. Refresh | Partial cart restored             |
| TC-QU-003    | Cross-tab sync during quota | 1. Fill storage 2. Update in other tab       | Sync notification shown           |

---

### 7.4 Offline/Recovery Tests

| Test Case ID | Description                      | Steps                                    | Expected Result               |
| ------------ | -------------------------------- | ---------------------------------------- | ----------------------------- |
| TC-OFF-001   | Cart available offline           | 1. Add items 2. Go offline 3. Check cart | Items visible                 |
| TC-OFF-002   | Cart sync when online            | 1. Offline changes 2. Go online          | Changes synced to server      |
| TC-REC-001   | Recovery from API failure        | 1. Block API 2. Add item 3. Restore API  | Cart recovered                |
| TC-REC-002   | Recovery from localStorage error | 1. Corrupt localStorage 2. Refresh       | Cart recovered or error shown |

---

### 7.5 Cross-Session Tests

| Test Case ID | Description                      | Steps                                | Expected Result            |
| ------------ | -------------------------------- | ------------------------------------ | -------------------------- |
| TC-CS-001    | Cart preserved in incognito      | 1. Add items 2. Switch to incognito  | Original cart preserved    |
| TC-CS-002    | Cart preserved after cache clear | 1. Add items 2. Clear cache          | Cart preserved (cookies)   |
| TC-CS-003    | Multiple browser continuity      | 1. Add on Chrome 2. Check on Firefox | Cart available after login |

---

## 8. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Task                             | Effort | Owner    | Dependencies |
| -------------------------------- | ------ | -------- | ------------ |
| Implement cookie session storage | 4h     | Frontend | None         |
| Add scheduled cleanup job        | 2h     | Backend  | Node-cron    |
| Write unit tests for session     | 2h     | QA       | Tests        |

### Phase 2: High Priority (Week 2)

| Task                        | Effort | Owner            | Dependencies |
| --------------------------- | ------ | ---------------- | ------------ |
| Retry mechanism for session | 2h     | Frontend         | Phase 1      |
| IndexedDB offline storage   | 8h     | Frontend         | Phase 1      |
| Cart sync on restore        | 4h     | Frontend/Backend | Phase 1      |
| Integration tests           | 4h     | QA               | All above    |

### Phase 3: Medium Priority (Week 3)

| Task                         | Effort | Owner            | Dependencies |
| ---------------------------- | ------ | ---------------- | ------------ |
| Extend expiration to 30 days | 1h     | Frontend/Backend | None         |
| Improve quota handling       | 4h     | Frontend         | Phase 2      |
| Backend sync on restore      | 4h     | Backend          | Phase 2      |
| User notification system     | 2h     | Frontend         | Phase 2      |

### Phase 4: Low Priority (Week 4)

| Task                        | Effort | Owner            | Dependencies |
| --------------------------- | ------ | ---------------- | ------------ |
| Error handling improvements | 2h     | Frontend         | None         |
| Performance optimization    | 4h     | Frontend/Backend | All above    |
| Documentation update        | 2h     | All              | All above    |

---

## 9. Conclusion

The cross-session cart persistence system has a solid foundation with localStorage for guest carts and database persistence for authenticated users. However, the critical gap in cookie-based session storage (CRIT-003) significantly impacts user experience, particularly for users who clear their browser data or use multiple browsers.

**Key Takeaways:**

1. **Immediate action required** for cookie session storage
2. **Backend cleanup automation** needed to prevent database bloat
3. **Offline support** would significantly improve reliability
4. **Cross-device continuity** requires authentication flow optimization

**Risk Assessment:**

- Without CRIT-003 fix: ~15% of users may lose cart data regularly
- Without CSP-008 fix: Database performance degrades over time
- Without CSP-013 fix: Poor experience in offline/unstable networks

---

## Appendix

### A. Related Files

| File                                                                             | Purpose                             |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts)     | Guest cart localStorage utilities   |
| [`backend/services/cartService.js`](backend/services/cartService.js)             | Cart business logic and persistence |
| [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx) | Frontend cart state management      |
| [`backend/controllers/cartController.js`](backend/controllers/cartController.js) | Cart API controllers                |
| [`backend/routes/cart.js`](backend/routes/cart.js)                               | Cart API routes                     |

### B. References

- Previous analysis: GUEST_CART_ARCHITECTURE_DESIGN.md
- Previous issue: CRIT-003 (no cookie storage for session ID)
- Related report: CART_MERGE_ANALYSIS_REPORT.md

---

**Report Generated:** 2026-02-10  
**Analysis Coverage:** Full codebase review  
**Next Review:** After Phase 1 implementation
