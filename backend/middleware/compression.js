/**
 * Response Compression Middleware
 * 
 * Enhanced compression middleware with:
 * - Brotli compression for modern browsers
 * - Gzip fallback for older browsers
 * - Skip compression for small responses (< 1KB)
 * - JSON API response compression
 * - Compressed response caching
 * 
 * @module middleware/compression
 */

const zlib = require('zlib');
const { promisify } = require('util');
const { loggerService } = require('../services/logger');

// Promisify zlib functions
const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

// Compression cache
const compressionCache = new Map();
const CACHE_MAX_SIZE = parseInt(process.env.COMPRESSION_CACHE_SIZE) || 1000;
const CACHE_TTL_MS = parseInt(process.env.COMPRESSION_CACHE_TTL) || 300000; // 5 minutes

// Compression configuration
const COMPRESSION_CONFIG = {
  // Brotli options
  brotli: {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Balance between speed and compression
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
    },
  },
  // Gzip options
  gzip: {
    level: 6, // Balance between speed and compression
    chunkSize: 16 * 1024,
  },
  // Deflate options
  deflate: {
    level: 6,
    chunkSize: 16 * 1024,
  },
};

// Minimum size to compress (1KB)
const MIN_COMPRESS_SIZE = 1024;

// Maximum size to cache (100KB)
const MAX_CACHE_SIZE = 100 * 1024;

// Content types to compress
const COMPRESSIBLE_TYPES = [
  'application/json',
  'application/javascript',
  'application/xml',
  'text/html',
  'text/css',
  'text/plain',
  'text/xml',
  'text/javascript',
  'image/svg+xml',
];

/**
 * Check if content type should be compressed
 */
function shouldCompressContentType(contentType) {
  if (!contentType) return false;
  
  const normalizedType = contentType.split(';')[0].trim().toLowerCase();
  return COMPRESSIBLE_TYPES.some(type => 
    normalizedType === type || normalizedType.endsWith(`+${type.split('/')[1]}`)
  );
}

/**
 * Check if request accepts Brotli compression
 */
function acceptsBrotli(req) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  return acceptEncoding.includes('br');
}

/**
 * Check if request accepts Gzip compression
 */
function acceptsGzip(req) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  return acceptEncoding.includes('gzip');
}

/**
 * Check if request accepts Deflate compression
 */
function acceptsDeflate(req) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  return acceptEncoding.includes('deflate');
}

/**
 * Generate cache key for compressed content
 */
function generateCacheKey(body, encoding) {
  // Simple hash for cache key
  let hash = 0;
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${encoding}_${Math.abs(hash)}`;
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of compressionCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      compressionCache.delete(key);
      cleaned++;
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (compressionCache.size > CACHE_MAX_SIZE) {
    const sorted = Array.from(compressionCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = compressionCache.size - CACHE_MAX_SIZE;
    for (let i = 0; i < toRemove; i++) {
      compressionCache.delete(sorted[i][0]);
    }
  }
  
  if (cleaned > 0) {
    loggerService.debug('Cleaned expired compression cache entries', { cleaned });
  }
}

// Clean cache periodically
setInterval(cleanExpiredCache, 60000);

/**
 * Compress data with Brotli
 */
async function compressBrotli(data) {
  return await brotliCompress(data, COMPRESSION_CONFIG.brotli);
}

/**
 * Compress data with Gzip
 */
async function compressGzip(data) {
  return await gzip(data, COMPRESSION_CONFIG.gzip);
}

/**
 * Compress data with Deflate
 */
async function compressDeflate(data) {
  return await deflate(data, COMPRESSION_CONFIG.deflate);
}

/**
 * Get cached compressed content or compress and cache
 */
async function getCompressedContent(body, encoding) {
  // Don't cache large responses
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  
  if (bodyBuffer.length > MAX_CACHE_SIZE) {
    // Compress without caching
    switch (encoding) {
      case 'br':
        return await compressBrotli(bodyBuffer);
      case 'gzip':
        return await compressGzip(bodyBuffer);
      case 'deflate':
        return await compressDeflate(bodyBuffer);
      default:
        return bodyBuffer;
    }
  }
  
  const cacheKey = generateCacheKey(body, encoding);
  const cached = compressionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  
  // Compress and cache
  let compressed;
  switch (encoding) {
    case 'br':
      compressed = await compressBrotli(bodyBuffer);
      break;
    case 'gzip':
      compressed = await compressGzip(bodyBuffer);
      break;
    case 'deflate':
      compressed = await compressDeflate(bodyBuffer);
      break;
    default:
      return bodyBuffer;
  }
  
  // Cache if compression was beneficial
  if (compressed.length < bodyBuffer.length * 0.95) {
    compressionCache.set(cacheKey, {
      data: compressed,
      timestamp: Date.now(),
      originalSize: bodyBuffer.length,
      compressedSize: compressed.length,
    });
  }
  
  return compressed;
}

/**
 * Compression middleware
 */
function compressionMiddleware(options = {}) {
  const {
    filter = shouldCompressContentType,
    threshold = MIN_COMPRESS_SIZE,
    enableCache = true,
  } = options;

  return async (req, res, next) => {
    // Skip if no compression accepted
    if (!acceptsBrotli(req) && !acceptsGzip(req) && !acceptsDeflate(req)) {
      return next();
    }
    
    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalJson = res.json;
    
    let buffer = null;
    let isCompressed = false;
    
    // Determine best encoding
    const encoding = acceptsBrotli(req) ? 'br' : 
                     acceptsGzip(req) ? 'gzip' : 'deflate';
    
    // Override write method
    res.write = function(chunk, encoding) {
      if (!buffer) {
        buffer = [];
      }
      buffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      return true;
    };
    
    // Override end method
    res.end = async function(chunk, encoding) {
      if (isCompressed) return;
      isCompressed = true;
      
      if (chunk) {
        buffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      
      const body = buffer ? Buffer.concat(buffer) : Buffer.alloc(0);
      
      // Check if should compress
      const contentType = res.get('Content-Type');
      const shouldCompress = body.length >= threshold && 
                            filter(contentType) &&
                            res.statusCode >= 200 && 
                            res.statusCode < 300;
      
      if (!shouldCompress) {
        // Restore original methods and send uncompressed
        res.write = originalWrite;
        res.end = originalEnd;
        return originalEnd.call(res, body);
      }
      
      try {
        const compressed = enableCache 
          ? await getCompressedContent(body, encoding)
          : await (encoding === 'br' ? compressBrotli(body) : 
                   encoding === 'gzip' ? compressGzip(body) : compressDeflate(body));
        
        // Set compression headers
        res.set('Content-Encoding', encoding);
        res.set('Vary', 'Accept-Encoding');
        res.set('Content-Length', compressed.length);
        
        // Remove content-length if it was set (we're changing it)
        res.removeHeader('content-length');
        
        // Log compression stats in development
        if (process.env.NODE_ENV === 'development') {
          const compressionRatio = ((1 - (compressed.length / body.length)) * 100).toFixed(1);
          loggerService.debug('Response compressed', {
            encoding,
            originalSize: body.length,
            compressedSize: compressed.length,
            ratio: `${compressionRatio}%`,
            path: req.path,
          });
        }
        
        // Restore original methods and send compressed
        res.write = originalWrite;
        res.end = originalEnd;
        return originalEnd.call(res, compressed);
      } catch (error) {
        loggerService.error('Compression error', { error: error.message, path: req.path });
        
        // Restore original methods and send uncompressed on error
        res.write = originalWrite;
        res.end = originalEnd;
        return originalEnd.call(res, body);
      }
    };
    
    // Override json method to ensure compression is applied
    res.json = function(body) {
      const json = JSON.stringify(body);
      res.set('Content-Type', 'application/json');
      return res.end(json);
    };
    
    next();
  };
}

/**
 * Stream compression middleware for streaming responses
 */
function streamCompressionMiddleware(options = {}) {
  const { threshold = MIN_COMPRESS_SIZE } = options;
  
  return (req, res, next) => {
    // Skip if no compression accepted
    if (!acceptsBrotli(req) && !acceptsGzip(req) && !acceptsDeflate(req)) {
      return next();
    }
    
    // Determine best encoding
    const encoding = acceptsBrotli(req) ? 'br' : 
                     acceptsGzip(req) ? 'gzip' : 'deflate';
    
    // Create compression stream
    let compressionStream;
    
    switch (encoding) {
      case 'br':
        compressionStream = zlib.createBrotliCompress(COMPRESSION_CONFIG.brotli);
        break;
      case 'gzip':
        compressionStream = zlib.createGzip(COMPRESSION_CONFIG.gzip);
        break;
      case 'deflate':
        compressionStream = zlib.createDeflate(COMPRESSION_CONFIG.deflate);
        break;
    }
    
    // Store original write and end
    const originalWrite = res.write;
    const originalEnd = res.end;
    
    let totalSize = 0;
    let compressionEnabled = false;
    let buffer = [];
    
    res.write = function(chunk, encoding) {
      totalSize += chunk.length;
      
      if (!compressionEnabled) {
        buffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        
        // Check if we should start compressing
        if (totalSize >= threshold) {
          compressionEnabled = true;
          
          // Set compression headers
          res.set('Content-Encoding', encoding);
          res.set('Vary', 'Accept-Encoding');
          res.removeHeader('Content-Length');
          
          // Pipe through compression
          compressionStream.pipe(res);
          
          // Write buffered data
          buffer.forEach(buf => compressionStream.write(buf));
          buffer = null;
        }
        
        return true;
      }
      
      return compressionStream.write(chunk);
    };
    
    res.end = function(chunk, encoding) {
      if (chunk) {
        if (compressionEnabled) {
          compressionStream.end(chunk);
        } else {
          buffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
          
          // Not enough data to compress, send uncompressed
          res.write = originalWrite;
          res.end = originalEnd;
          
          buffer.forEach(buf => originalWrite.call(res, buf));
          return originalEnd.call(res);
        }
      } else if (compressionEnabled) {
        compressionStream.end();
      } else {
        // Not enough data to compress, send uncompressed
        res.write = originalWrite;
        res.end = originalEnd;
        
        buffer.forEach(buf => originalWrite.call(res, buf));
        return originalEnd.call(res);
      }
    };
    
    next();
  };
}

/**
 * Get compression statistics
 */
function getCompressionStats() {
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  
  for (const entry of compressionCache.values()) {
    totalOriginalSize += entry.originalSize;
    totalCompressedSize += entry.compressedSize;
  }
  
  const savingsPercent = totalOriginalSize > 0 
    ? ((1 - (totalCompressedSize / totalOriginalSize)) * 100).toFixed(2)
    : 0;
  
  return {
    cacheSize: compressionCache.size,
    cacheMaxSize: CACHE_MAX_SIZE,
    totalOriginalSize,
    totalCompressedSize,
    savingsPercent,
    cacheHitRate: null, // Would need to track hits vs misses
  };
}

/**
 * Clear compression cache
 */
function clearCompressionCache() {
  compressionCache.clear();
  loggerService.info('Compression cache cleared');
}

module.exports = {
  compressionMiddleware,
  streamCompressionMiddleware,
  shouldCompressContentType,
  acceptsBrotli,
  acceptsGzip,
  acceptsDeflate,
  getCompressionStats,
  clearCompressionCache,
};
