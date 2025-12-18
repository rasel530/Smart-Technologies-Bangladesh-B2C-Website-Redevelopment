#!/bin/sh

echo "=== OpenSSL Debug Script ==="
echo "Checking OpenSSL installation..."

# Check if OpenSSL is installed
if command -v openssl >/dev/null 2>&1; then
    echo "✅ OpenSSL version: $(openssl version)"
else
    echo "❌ OpenSSL not found"
    exit 1
fi

# Check for OpenSSL libraries
echo "Checking for OpenSSL libraries..."
find /usr/lib -name "*ssl*" -type f 2>/dev/null || echo "No SSL libraries found in /usr/lib"
find /lib -name "*ssl*" -type f 2>/dev/null || echo "No SSL libraries found in /lib"
find /usr/local/lib -name "*ssl*" -type f 2>/dev/null || echo "No SSL libraries found in /usr/local/lib"

# Check specifically for libssl.so.1.1
echo "Checking specifically for libssl.so.1.1..."
if [ -f "/usr/lib/libssl.so.1.1" ]; then
    echo "✅ Found /usr/lib/libssl.so.1.1"
elif [ -f "/lib/libssl.so.1.1" ]; then
    echo "✅ Found /lib/libssl.so.1.1"
elif [ -f "/usr/local/lib/libssl.so.1.1" ]; then
    echo "✅ Found /usr/local/lib/libssl.so.1.1"
else
    echo "❌ libssl.so.1.1 not found in standard locations"
fi

# Check what SSL libraries are available
echo "Available SSL libraries:"
find /usr -name "*ssl*.so*" 2>/dev/null | head -10
find /lib -name "*ssl*.so*" 2>/dev/null | head -10

# Check Alpine package info
echo "Alpine SSL package info:"
apk info openssl 2>/dev/null || echo "Failed to get OpenSSL package info"

echo "=== End OpenSSL Debug ==="