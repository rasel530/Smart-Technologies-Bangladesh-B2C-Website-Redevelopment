/**
 * Add Items to Cart Test Script
 * 
 * This script adds products to the cart for checkout flow testing.
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

let authToken = null;

/**
 * Make HTTP request
 */
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Login and get authentication token
 */
async function login() {
  console.log('=== Login ===');
  try {
    const response = await makeRequest('POST', `${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      if (response.data.token) {
        authToken = response.data.token;
        console.log('✅ Login successful');
        console.log(`   User ID: ${response.data.user?.id}`);
        console.log(`   Email: ${response.data.user?.email}`);
        return true;
      } else {
        console.log('❌ Login failed: No token in response');
        return false;
      }
    } else {
      console.log(`❌ Login failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return false;
  }
}

/**
 * Get available products
 */
async function getProducts() {
  console.log('\n=== Get Products ===');
  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/products?limit=10`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const products = response.data.products || response.data || [];
      console.log(`✅ Retrieved ${products.length} products`);
      
      if (products.length > 0) {
        console.log('\nAvailable Products:');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      ID: ${product.id}`);
          console.log(`      Price: ${product.price}`);
          console.log(`      Stock: ${product.stock || product.quantity || 'N/A'}`);
          console.log(`      Has Variants: ${product.variants && product.variants.length > 0 ? 'Yes' : 'No'}`);
        });
      }
      
      return products;
    } else {
      console.log(`❌ Get products failed: ${response.statusCode}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Get products error: ${error.message}`);
    return [];
  }
}

/**
 * Get cart ID
 */
async function getCartId() {
  console.log('\n=== Get Cart ID ===');
  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/cart`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      console.log('Full cart response:', JSON.stringify(response.data, null, 2));
      const cartId = response.data.id || response.data.cart?.id;
      if (cartId) {
        console.log(`✅ Cart ID retrieved: ${cartId}`);
        return cartId;
      } else {
        console.log('⚠️  No cart ID in response');
        return null;
      }
    } else {
      console.log(`❌ Get cart failed: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ Get cart error: ${error.message}`);
    return null;
  }
}

/**
 * Add item to cart
 */
async function addToCart(productId, quantity = 1, variantId = null) {
  console.log(`\n=== Add to Cart ===`);
  console.log(`   Product ID: ${productId}`);
  console.log(`   Quantity: ${quantity}`);
  console.log(`   Variant ID: ${variantId || 'None'}`);
  
  try {
    // First get the cart ID
    const cartId = await getCartId();
    if (!cartId) {
      console.log('❌ Cannot add to cart: No cart ID');
      return false;
    }

    const cartData = {
      cartId: cartId,
      productId: productId,
      quantity: quantity
    };
    
    // Only include variantId if it's provided
    if (variantId) {
      cartData.variantId = variantId;
    }

    const response = await makeRequest('POST', `${API_BASE_URL}/cart/items`, cartData, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ Item added to cart successfully');
      console.log(`   Status: ${response.statusCode}`);
      return true;
    } else {
      console.log(`❌ Add to cart failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Add to cart error: ${error.message}`);
    return false;
  }
}

/**
 * Get cart items
 */
async function getCart() {
  console.log('\n=== Get Cart Items ===');
  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/cart`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      console.log(`✅ Cart retrieved successfully`);
      console.log(`   Items in cart: ${cartItems.length}`);
      
      if (cartItems.length > 0) {
        console.log('\nCart Items:');
        cartItems.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product?.name || item.name || 'Unknown'}`);
          console.log(`      Product ID: ${item.productId}`);
          console.log(`      Quantity: ${item.quantity}`);
          console.log(`      Variant ID: ${item.variantId || 'None (no variant)'}`);
          console.log(`      Price: ${item.price || item.product?.price || 'N/A'}`);
        });
      }
      
      return cartItems;
    } else {
      console.log(`❌ Get cart failed: ${response.statusCode}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Get cart error: ${error.message}`);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('ADD ITEMS TO CART FOR CHECKOUT FLOW TESTING');
  console.log('='.repeat(80));

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Get products
  const products = await getProducts();
  if (products.length === 0) {
    console.log('\n❌ No products available to add to cart');
    return;
  }

  // Add products without variants to cart (primary test case)
  console.log('\n' + '='.repeat(80));
  console.log('ADDING PRODUCTS WITHOUT VARIANTS TO CART');
  console.log('='.repeat(80));
  
  const productsWithoutVariants = products.filter(p => !p.variants || p.variants.length === 0);
  
  if (productsWithoutVariants.length > 0) {
    // Add first 2 products without variants
    const itemsToAdd = productsWithoutVariants.slice(0, 2);
    for (const product of itemsToAdd) {
      await addToCart(product.id, 1, null);
    }
  } else {
    console.log('⚠️  No products without variants found');
    console.log('Adding first available product instead...');
    await addToCart(products[0].id, 1, null);
  }

  // Get cart to verify
  const cartItems = await getCart();

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Items added to cart: ${cartItems.length}`);
  console.log(`Ready for checkout flow testing`);
  console.log('='.repeat(80));
}

// Run
main();
