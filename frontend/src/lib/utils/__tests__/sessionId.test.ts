/**
 * Session ID Generation Test Suite
 * 
 * Comprehensive tests for session ID generation, validation,
 * persistence, and retry mechanisms.
 */

// Setup mocks before any imports
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockSessionStorage.store = {};
  }),
};

const mockDocument = {
  cookie: '',
};

// Assign mocks to global
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Import after mocks are set up
import {
  generateGuestSessionId,
  generateGuestSessionIdWithRetry,
  setGuestSessionId,
  getGuestSessionId,
  setGuestSessionIdCookie,
  getGuestSessionIdFromCookie,
  setGuestSessionIdUtil,
} from '@/lib/utils/guestCart';

describe('Session ID Generation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    mockLocalStorage.store = {};
    mockSessionStorage.clear();
    mockSessionStorage.store = {};
    mockDocument.cookie = '';
    jest.clearAllMocks();
  });

  describe('generateGuestSessionId', () => {
    it('should generate unique IDs on consecutive calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateGuestSessionId());
      }
      expect(ids.size).toBe(100);
    });

    it('should include timestamp prefix', () => {
      const id = generateGuestSessionId();
      expect(id.startsWith('guest_')).toBe(true);
    });

    it('should generate reproducible format', () => {
      const id = generateGuestSessionId();
      const parts = id.split('_');
      
      expect(parts[0]).toBe('guest');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp should be numeric
      expect(parts.length).toBe(3);
    });

    it('should generate IDs within expected length range', () => {
      const id = generateGuestSessionId();
      expect(id.length).toBeGreaterThan(15);
      expect(id.length).toBeLessThan(50);
    });

    it('should include random component', () => {
      const id1 = generateGuestSessionId();
      const id2 = generateGuestSessionId();
      
      const random1 = id1.split('_')[2];
      const random2 = id2.split('_')[2];
      
      expect(random1).not.toBe(random2);
    });

    it('should generate IDs that can be parsed', () => {
      const id = generateGuestSessionId();
      const parts = id.split('_');
      
      expect(() => parseInt(parts[1], 10)).not.toThrow();
      expect(parseInt(parts[1], 10)).toBeGreaterThan(0);
    });

    it('should include lowercase letters and numbers in random part', () => {
      const id = generateGuestSessionId();
      const randomPart = id.split('_')[2];
      
      expect(randomPart).toMatch(/^[a-z0-9]+$/);
    });

    it('should not generate duplicate IDs under normal circumstances', () => {
      const ids: string[] = [];
      for (let i = 0; i < 1000; i++) {
        ids.push(generateGuestSessionId());
      }
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(1000);
    });
  });

  describe('generateGuestSessionIdWithRetry', () => {
    it('should generate session ID successfully', async () => {
      const id = await generateGuestSessionIdWithRetry();
      
      expect(id).toBeDefined();
      expect(id.startsWith('guest_')).toBe(true);
    });

    it('should return existing ID if present in localStorage', async () => {
      mockLocalStorage.setItem('smart_tech_guest_session', 'existing_id');
      
      const id = await generateGuestSessionIdWithRetry();
      
      expect(id).toBe('existing_id');
    });

    it('should return existing ID if present in cookie when localStorage is empty', async () => {
      mockDocument.cookie = 'smart_tech_guest_session=cookie_session_id';
      
      const id = await generateGuestSessionIdWithRetry();
      
      expect(id).toBe('cookie_session_id');
    });

    it('should prefer localStorage over cookie', async () => {
      mockLocalStorage.setItem('smart_tech_guest_session', 'local_id');
      mockDocument.cookie = 'smart_tech_guest_session=cookie_id';
      
      const id = await generateGuestSessionIdWithRetry();
      
      expect(id).toBe('local_id');
    });

    it('should generate new ID when storage is empty', async () => {
      const id = await generateGuestSessionIdWithRetry();
      
      expect(id).toBeDefined();
      expect(id.startsWith('guest_')).toBe(true);
    });

    it('should store generated ID in localStorage', async () => {
      await generateGuestSessionIdWithRetry();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart_tech_guest_session',
        expect.stringMatching(/^guest_/)
      );
    });

    it('should store generated ID in cookie', async () => {
      await generateGuestSessionIdWithRetry();
      
      expect(mockDocument.cookie).toContain('smart_tech_guest_session=');
    });
  });

  describe('Session ID Persistence', () => {
    describe('setGuestSessionId', () => {
      it('should store session ID in localStorage', () => {
        setGuestSessionId('test_session_id');
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'smart_tech_guest_session',
          'test_session_id'
        );
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe('test_session_id');
      });

      it('should overwrite existing session ID', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'old_id');
        
        setGuestSessionId('new_id');
        
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe('new_id');
      });

      it('should handle special characters in session ID', () => {
        const specialId = 'session_abc-123_xyz';
        setGuestSessionId(specialId);
        
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe(specialId);
      });

      it('should handle long session IDs', () => {
        const longId = 'a'.repeat(1000);
        setGuestSessionId(longId);
        
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe(longId);
      });
    });

    describe('getGuestSessionId', () => {
      it('should return null when not set', () => {
        const result = getGuestSessionId();
        
        expect(result).toBeNull();
      });

      it('should return stored session ID', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'stored_id');
        
        const result = getGuestSessionId();
        
        expect(result).toBe('stored_id');
      });

      it('should return null after removal', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'temp_id');
        mockLocalStorage.removeItem('smart_tech_guest_session');
        
        const result = getGuestSessionId();
        
        expect(result).toBeNull();
      });
    });

    describe('Cookie Operations', () => {
      describe('setGuestSessionIdCookie', () => {
        it('should set session ID in cookie', () => {
          setGuestSessionIdCookie('cookie_session');
          
          expect(mockDocument.cookie).toContain('smart_tech_guest_session=cookie_session');
        });

        it('should set path to root', () => {
          setGuestSessionIdCookie('test');
          
          expect(mockDocument.cookie).toContain('path=/');
        });

        it('should include SameSite attribute', () => {
          setGuestSessionIdCookie('test');
          
          expect(mockDocument.cookie).toContain('SameSite=');
        });

        it('should include expiration date', () => {
          const before = Date.now();
          setGuestSessionIdCookie('test');
          const after = Date.now();
          
          const expiresMatch = mockDocument.cookie.match(/expires=([^;]+)/);
          expect(expiresMatch).toBeTruthy();
          
          const expiresDate = new Date(expiresMatch![1]).getTime();
          const expectedMin = before + (7 * 24 * 60 * 60 * 1000) - 60000;
          const expectedMax = after + (7 * 24 * 60 * 60 * 1000) + 60000;
          
          expect(expiresDate).toBeGreaterThanOrEqual(expectedMin);
          expect(expiresDate).toBeLessThanOrEqual(expectedMax);
        });
      });

      describe('getGuestSessionIdFromCookie', () => {
        it('should return null for missing cookie', () => {
          const result = getGuestSessionIdFromCookie();
          
          expect(result).toBeNull();
        });

        it('should extract session ID from cookie', () => {
          mockDocument.cookie = 'smart_tech_guest_session=my_session_id';
          
          const result = getGuestSessionIdFromCookie();
          
          expect(result).toBe('my_session_id');
        });

        it('should return null for empty cookie value', () => {
          mockDocument.cookie = 'smart_tech_guest_session=';
          
          const result = getGuestSessionIdFromCookie();
          
          expect(result).toBeNull();
        });

        it('should handle multiple cookies', () => {
          mockDocument.cookie = 'a=1; smart_tech_guest_session=target_id; b=2';
          
          const result = getGuestSessionIdFromCookie();
          
          expect(result).toBe('target_id');
        });
      });
    });

    describe('setGuestSessionIdUtil', () => {
      it('should store in both localStorage and cookie', () => {
        setGuestSessionIdUtil('combined_session');
        
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe('combined_session');
        expect(mockDocument.cookie).toContain('smart_tech_guest_session=combined_session');
      });

      it('should update both storage mechanisms', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'old');
        mockDocument.cookie = 'smart_tech_guest_session=old';
        
        setGuestSessionIdUtil('new');
        
        expect(mockLocalStorage.store['smart_tech_guest_session']).toBe('new');
        expect(mockDocument.cookie).toContain('smart_tech_guest_session=new');
      });
    });
  });

  describe('Session ID Format Validation', () => {
    it('should validate guest session ID format', () => {
      const isValidGuestSessionId = (id: string): boolean => {
        return /^guest_\\d+_[a-z0-9]+$/.test(id);
      };

      expect(isValidGuestSessionId('guest_1234567890_abc123')).toBe(true);
      expect(isValidGuestSessionId('guest_1234567890_ABC123')).toBe(false);
      expect(isValidGuestSessionId('user_1234567890_abc123')).toBe(false);
      expect(isValidGuestSessionId('guest_abc_abc123')).toBe(false);
      expect(isValidGuestSessionId('guest_1234567890')).toBe(false);
    });

    it('should validate session ID is not empty', () => {
      const isValidSessionId = (id: string | null): boolean => {
        return typeof id === 'string' && id.length > 0;
      };

      expect(isValidSessionId('valid_id')).toBe(true);
      expect(isValidSessionId('')).toBe(false);
      expect(isValidSessionId(null)).toBe(false);
      expect(isValidSessionId(undefined)).toBe(false);
    });

    it('should validate session ID length', () => {
      const isValidLength = (id: string): boolean => {
        return id.length >= 10 && id.length <= 100;
      };

      expect(isValidLength('guest_1234567890_abc')).toBe(true);
      expect(isValidLength('g_1_a')).toBe(false);
      expect(isValidLength('a'.repeat(150))).toBe(false);
    });
  });
});
