/**
 * Comprehensive Test Data Seeding for Shopping Cart Functionality
 * Phase 6, Milestone 1 - DB-CRIT-002 Fix
 * 
 * This seed file creates realistic test data for:
 * - Products (at least 10 products with various prices)
 * - Carts (user carts and guest carts)
 * - Cart items (multiple items per cart)
 * - Cart events (user interaction tracking)
 * - Cart analytics (conversion funnel data)
 * - Edge cases and error scenarios
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to generate random UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number in range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random decimal
function getRandomDecimal(min, max, decimals = 2) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

// Helper function to add days to date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to subtract days from date
function subtractDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// ============================================================================
// SEED DATA
// ============================================================================

async function main() {
  console.log('🌱 Starting comprehensive test data seeding...\n');

  try {
    // ============================================================================
    // PART 1: Create Sample Products (at least 10 products)
    // ============================================================================
    console.log('📦 Creating sample products...');

    const products = [
      {
        id: generateUUID(),
        sku: 'LAP-001',
        name: 'Lenovo ThinkPad X1 Carbon',
        nameEn: 'Lenovo ThinkPad X1 Carbon',
        nameBn: 'লেনোভো থিংকপ্যাড X1 কার্বন',
        slug: 'lenovo-thinkpad-x1-carbon',
        shortDescription: 'Ultra-light business laptop with 14" display',
        description: 'The Lenovo ThinkPad X1 Carbon is the ultimate business laptop with a stunning 14" display, powerful Intel Core i7 processor, and all-day battery life.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 185000.00,
        salePrice: 165000.00,
        costPrice: 140000.00,
        taxRate: 0.15,
        stockQuantity: 25,
        lowStockThreshold: 5,
        status: 'active',
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 24,
        warrantyType: 'years',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-002',
        name: 'Lenovo IdeaPad Gaming 3',
        nameEn: 'Lenovo IdeaPad Gaming 3',
        nameBn: 'লেনোভো আইডিয়াপ্যাড গেমিং 3',
        slug: 'lenovo-ideapad-gaming-3',
        shortDescription: 'Powerful gaming laptop with RTX graphics',
        description: 'Experience gaming at its best with the Lenovo IdeaPad Gaming 3 featuring NVIDIA RTX 3050 graphics and 15.6" FHD display.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 125000.00,
        salePrice: null,
        costPrice: 95000.00,
        taxRate: 0.15,
        stockQuantity: 40,
        lowStockThreshold: 10,
        status: 'active',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'years',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'TAB-001',
        name: 'Lenovo Tab M10 Plus',
        nameEn: 'Lenovo Tab M10 Plus',
        nameBn: 'লেনোভো ট্যাব M10 প্লাস',
        slug: 'lenovo-tab-m10-plus',
        shortDescription: '10.3" FHD tablet for entertainment',
        description: 'The Lenovo Tab M10 Plus is perfect for entertainment with its 10.3" FHD display and long battery life.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 28000.00,
        salePrice: 24500.00,
        costPrice: 20000.00,
        taxRate: 0.15,
        stockQuantity: 60,
        lowStockThreshold: 15,
        status: 'active',
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-003',
        name: 'Lenovo Legion 5 Pro',
        nameEn: 'Lenovo Legion 5 Pro',
        nameBn: 'লেনোভো লিজিয়ন 5 প্রো',
        slug: 'lenovo-legion-5-pro',
        shortDescription: 'Ultimate gaming laptop with RTX 3070',
        description: 'Dominate the competition with the Lenovo Legion 5 Pro featuring NVIDIA RTX 3070 and 16" QHD display.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 220000.00,
        salePrice: 198000.00,
        costPrice: 165000.00,
        taxRate: 0.15,
        stockQuantity: 15,
        lowStockThreshold: 3,
        status: 'active',
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 24,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-004',
        name: 'Lenovo Yoga 9i',
        nameEn: 'Lenovo Yoga 9i',
        nameBn: 'লেনোভো ইয়োগা 9i',
        slug: 'lenovo-yoga-9i',
        shortDescription: 'Premium 2-in-1 convertible laptop',
        description: 'The Lenovo Yoga 9i is a premium 2-in-1 with stunning 4K OLED display and Intel Evo platform.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 245000.00,
        salePrice: null,
        costPrice: 185000.00,
        taxRate: 0.15,
        stockQuantity: 20,
        lowStockThreshold: 5,
        status: 'active',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 24,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'TAB-002',
        name: 'Lenovo Tab P11',
        nameEn: 'Lenovo Tab P11',
        nameBn: 'লেনোভো ট্যাব P11',
        slug: 'lenovo-tab-p11',
        shortDescription: '11" 2K tablet for productivity',
        description: 'Boost your productivity with the Lenovo Tab P11 featuring 11" 2K display and keyboard support.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 35000.00,
        salePrice: 32000.00,
        costPrice: 26000.00,
        taxRate: 0.15,
        stockQuantity: 45,
        lowStockThreshold: 10,
        status: 'active',
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 12,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-005',
        name: 'Lenovo ThinkBook 14s',
        nameEn: 'Lenovo ThinkBook 14s',
        nameBn: 'লেনোভো থিংকবুক 14s',
        slug: 'lenovo-thinkbook-14s',
        shortDescription: 'Sleek business laptop for professionals',
        description: 'The Lenovo ThinkBook 14s is designed for professionals with AMD Ryzen processor and modern design.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 95000.00,
        salePrice: 85000.00,
        costPrice: 70000.00,
        taxRate: 0.15,
        stockQuantity: 30,
        lowStockThreshold: 8,
        status: 'active',
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-006',
        name: 'Lenovo IdeaPad Slim 3',
        nameEn: 'Lenovo IdeaPad Slim 3',
        nameBn: 'লেনোভো আইডিয়াপ্যাড স্লিম 3',
        slug: 'lenovo-ideapad-slim-3',
        shortDescription: 'Affordable everyday laptop',
        description: 'The Lenovo IdeaPad Slim 3 is perfect for everyday tasks with its slim design and long battery.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 65000.00,
        salePrice: 58000.00,
        costPrice: 48000.00,
        taxRate: 0.15,
        stockQuantity: 50,
        lowStockThreshold: 12,
        status: 'active',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'TAB-003',
        name: 'Lenovo Smart Tab M10',
        nameEn: 'Lenovo Smart Tab M10',
        nameBn: 'লেনোভো স্মার্ট ট্যাব M10',
        slug: 'lenovo-smart-tab-m10',
        shortDescription: 'Smart display and tablet in one',
        description: 'The Lenovo Smart Tab M10 doubles as a smart display and tablet for your home.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 22000.00,
        salePrice: null,
        costPrice: 16500.00,
        taxRate: 0.15,
        stockQuantity: 35,
        lowStockThreshold: 8,
        status: 'active',
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: false,
        warrantyPeriod: 12,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
      {
        id: generateUUID(),
        sku: 'LAP-007',
        name: 'Lenovo ThinkPad E14',
        nameEn: 'Lenovo ThinkPad E14',
        nameBn: 'লেনোভো থিংকপ্যাড E14',
        slug: 'lenovo-thinkpad-e14',
        shortDescription: 'Reliable business laptop',
        description: 'The Lenovo ThinkPad E14 is a reliable business laptop with excellent security features.',
        brandId: (await prisma.brand.findFirst({ where: { name: 'Lenovo' } }))?.id || generateUUID(),
        regularPrice: 110000.00,
        salePrice: 99000.00,
        costPrice: 82000.00,
        taxRate: 0.15,
        stockQuantity: 28,
        lowStockThreshold: 7,
        status: 'active',
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 36,
        warrantyType: 'months',
        visibility: 'public',
        publishedAt: new Date(),
      },
    ];

    // Insert products
    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      });
    }
    console.log(`✅ Created ${products.length} products\n`);

    // ============================================================================
    // PART 2: Create Sample Carts (user carts and guest carts)
    // ============================================================================
    console.log('🛒 Creating sample carts...');

    // Get or create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.upsert({
        where: { email: `testuser${i}@example.com` },
        update: {},
        create: {
          email: `testuser${i}@example.com`,
          firstName: `Test`,
          lastName: `User ${i}`,
          password: '$2b$10$abcdefghijklmnopqrstuv', // Placeholder hash
          role: i === 1 ? 'admin' : 'customer',
          status: 'active',
          preferredLanguage: 'en',
        },
      });
      testUsers.push(user);
    }

    // Create user carts
    const userCarts = [];
    for (let i = 0; i < 3; i++) {
      const cart = await prisma.cart.create({
        data: {
          userId: testUsers[i].id,
          status: 'active',
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          expiresAt: addDays(new Date(), 30),
        },
      });
      userCarts.push(cart);
    }

    // Create guest carts
    const guestCarts = [];
    for (let i = 0; i < 3; i++) {
      const cart = await prisma.cart.create({
        data: {
          sessionId: `guest-session-${generateUUID()}`,
          status: 'active',
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          expiresAt: addDays(new Date(), 7),
        },
      });
      guestCarts.push(cart);
    }

    // Create abandoned carts (edge case)
    const abandonedCarts = [];
    for (let i = 0; i < 2; i++) {
      const cart = await prisma.cart.create({
        data: {
          userId: testUsers[i + 3].id,
          status: 'abandoned',
          subtotal: getRandomDecimal(50000, 150000),
          tax: getRandomDecimal(7500, 22500),
          shippingCost: getRandomDecimal(500, 1500),
          discount: getRandomDecimal(0, 5000),
          total: getRandomDecimal(58000, 175000),
          expiresAt: subtractDays(new Date(), 1),
          updatedAt: subtractDays(new Date(), 2),
        },
      });
      abandonedCarts.push(cart);
    }

    // Create converted carts (edge case)
    const convertedCarts = [];
    for (let i = 0; i < 2; i++) {
      const cart = await prisma.cart.create({
        data: {
          userId: testUsers[i].id,
          status: 'converted',
          subtotal: getRandomDecimal(100000, 300000),
          tax: getRandomDecimal(15000, 45000),
          shippingCost: getRandomDecimal(1000, 3000),
          discount: getRandomDecimal(5000, 15000),
          total: getRandomDecimal(111000, 333000),
          updatedAt: subtractDays(new Date(), 5),
        },
      });
      convertedCarts.push(cart);
    }

    // Create expired carts (edge case)
    const expiredCarts = [];
    for (let i = 0; i < 2; i++) {
      const cart = await prisma.cart.create({
        data: {
          sessionId: `expired-session-${generateUUID()}`,
          status: 'expired',
          subtotal: getRandomDecimal(20000, 80000),
          tax: getRandomDecimal(3000, 12000),
          shippingCost: getRandomDecimal(200, 800),
          discount: 0,
          total: getRandomDecimal(23200, 92800),
          expiresAt: subtractDays(new Date(), 5),
          updatedAt: subtractDays(new Date(), 6),
        },
      });
      expiredCarts.push(cart);
    }

    const allCarts = [...userCarts, ...guestCarts, ...abandonedCarts, ...convertedCarts, ...expiredCarts];
    console.log(`✅ Created ${allCarts.length} carts (user: ${userCarts.length}, guest: ${guestCarts.length}, abandoned: ${abandonedCarts.length}, converted: ${convertedCarts.length}, expired: ${expiredCarts.length})\n`);

    // ============================================================================
    // PART 3: Create Cart Items (multiple items per cart)
    // ============================================================================
    console.log('📦 Creating cart items...');

    let totalCartItems = 0;
    for (const cart of allCarts) {
      if (cart.status === 'expired') continue; // Skip expired carts for items

      const numItems = getRandomInt(1, 5);
      const selectedProducts = [];
      
      for (let i = 0; i < numItems; i++) {
        const product = getRandomItem(products);
        const quantity = getRandomInt(1, 3);
        const price = product.salePrice || product.regularPrice;
        const subtotal = price * quantity;

        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: quantity,
            price: price,
            subtotal: subtotal,
            addedAt: subtractDays(new Date(), getRandomInt(1, 7)),
          },
        });
        totalCartItems++;
        selectedProducts.push(product.id);
      }

      // Update cart totals
      const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      const tax = subtotal * 0.15;
      const shippingCost = subtotal > 100000 ? 0 : 1000;
      const discount = subtotal > 200000 ? subtotal * 0.05 : 0;
      const total = subtotal + tax + shippingCost - discount;

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: subtotal,
          tax: tax,
          shippingCost: shippingCost,
          discount: discount,
          total: total,
        },
      });
    }
    console.log(`✅ Created ${totalCartItems} cart items\n`);

    // ============================================================================
    // PART 4: Create Cart Events (user interaction tracking)
    // ============================================================================
    console.log('📊 Creating cart events...');

    const eventTypes = ['item_added', 'item_removed', 'item_updated', 'cart_viewed', 'cart_abandoned', 'cart_converted'];
    let totalEvents = 0;

    for (const cart of allCarts) {
      // Generate events based on cart status
      if (cart.status === 'active') {
        // Active carts have mix of events
        const numEvents = getRandomInt(3, 10);
        for (let i = 0; i < numEvents; i++) {
          const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
          if (items.length === 0) continue;

          const item = getRandomItem(items);
          const eventType = getRandomItem(['item_added', 'item_updated', 'cart_viewed']);
          const timestamp = subtractDays(new Date(), getRandomInt(0, 7));

          await prisma.cartEvent.create({
            data: {
              cartId: cart.id,
              userId: cart.userId,
              eventType: eventType,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              timestamp: timestamp,
            },
          });
          totalEvents++;
        }
      } else if (cart.status === 'abandoned') {
        // Abandoned carts have abandonment event
        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        for (const item of items) {
          await prisma.cartEvent.create({
            data: {
              cartId: cart.id,
              userId: cart.userId,
              eventType: 'cart_abandoned',
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              timestamp: subtractDays(new Date(), 1),
            },
          });
          totalEvents++;
        }
      } else if (cart.status === 'converted') {
        // Converted carts have conversion event
        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        for (const item of items) {
          await prisma.cartEvent.create({
            data: {
              cartId: cart.id,
              userId: cart.userId,
              eventType: 'cart_converted',
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              timestamp: subtractDays(new Date(), 5),
            },
          });
          totalEvents++;
        }
      }
    }
    console.log(`✅ Created ${totalEvents} cart events\n`);

    // ============================================================================
    // PART 5: Create Cart Analytics (conversion funnel data)
    // ============================================================================
    console.log('📈 Creating cart analytics...');

    for (const cart of allCarts) {
      if (cart.status === 'expired') continue;

      const events = await prisma.cartEvent.findMany({ where: { cartId: cart.id } });
      const conversionFunnel = {
        view_count: events.filter(e => e.eventType === 'cart_viewed').length,
        add_count: events.filter(e => e.eventType === 'item_added').length,
        update_count: events.filter(e => e.eventType === 'item_updated').length,
        remove_count: events.filter(e => e.eventType === 'item_removed').length,
        conversion_status: cart.status,
        time_to_convert: cart.status === 'converted' ? 5 : null, // days
      };

      await prisma.cartAnalytics.upsert({
        where: { cartId: cart.id },
        update: {
          events: JSON.stringify(events),
          conversionFunnel: JSON.stringify(conversionFunnel),
        },
        create: {
          cartId: cart.id,
          events: JSON.stringify(events),
          conversionFunnel: JSON.stringify(conversionFunnel),
        },
      });
    }
    console.log(`✅ Created cart analytics for ${allCarts.filter(c => c.status !== 'expired').length} carts\n`);

    // ============================================================================
    // PART 6: Edge Cases and Error Scenarios
    // ============================================================================
    console.log('⚠️  Creating edge case scenarios...');

    // Edge case 1: Empty cart
    const emptyCart = await prisma.cart.create({
      data: {
        userId: testUsers[0].id,
        status: 'active',
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        expiresAt: addDays(new Date(), 30),
      },
    });

    // Edge case 2: Cart with single item
    const singleItemCart = await prisma.cart.create({
      data: {
        userId: testUsers[1].id,
        status: 'active',
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        expiresAt: addDays(new Date(), 30),
      },
    });
    await prisma.cartItem.create({
      data: {
        cartId: singleItemCart.id,
        productId: products[0].id,
        quantity: 1,
        price: products[0].regularPrice,
        subtotal: products[0].regularPrice,
        addedAt: new Date(),
      },
    });
    await prisma.cart.update({
      where: { id: singleItemCart.id },
      data: {
        subtotal: products[0].regularPrice,
        tax: products[0].regularPrice * 0.15,
        shippingCost: 1000,
        discount: 0,
        total: products[0].regularPrice * 1.15 + 1000,
      },
    });

    // Edge case 3: Cart with maximum discount
    const maxDiscountCart = await prisma.cart.create({
      data: {
        userId: testUsers[2].id,
        status: 'active',
        subtotal: 300000,
        tax: 45000,
        shippingCost: 0,
        discount: 15000, // 5% discount
        total: 330000,
        expiresAt: addDays(new Date(), 30),
      },
    });

    // Edge case 4: Cart with multiple quantities of same product
    const multiQuantityCart = await prisma.cart.create({
      data: {
        userId: testUsers[3].id,
        status: 'active',
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        expiresAt: addDays(new Date(), 30),
      },
    });
    const productForMulti = products[1];
    await prisma.cartItem.create({
      data: {
        cartId: multiQuantityCart.id,
        productId: productForMulti.id,
        quantity: 5,
        price: productForMulti.regularPrice,
        subtotal: productForMulti.regularPrice * 5,
        addedAt: new Date(),
      },
    });
    await prisma.cart.update({
      where: { id: multiQuantityCart.id },
      data: {
        subtotal: productForMulti.regularPrice * 5,
        tax: productForMulti.regularPrice * 5 * 0.15,
        shippingCost: 0,
        discount: 0,
        total: productForMulti.regularPrice * 5 * 1.15,
      },
    });

    // Edge case 5: Cart with items having different prices (sale vs regular)
    const mixedPriceCart = await prisma.cart.create({
      data: {
        userId: testUsers[4].id,
        status: 'active',
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        expiresAt: addDays(new Date(), 30),
      },
    });
    let mixedSubtotal = 0;
    for (let i = 0; i < 3; i++) {
      const product = products[i];
      const price = product.salePrice || product.regularPrice;
      await prisma.cartItem.create({
        data: {
          cartId: mixedPriceCart.id,
          productId: product.id,
          quantity: 1,
          price: price,
          subtotal: price,
          addedAt: new Date(),
        },
      });
      mixedSubtotal += price;
    }
    await prisma.cart.update({
      where: { id: mixedPriceCart.id },
      data: {
        subtotal: mixedSubtotal,
        tax: mixedSubtotal * 0.15,
        shippingCost: 1000,
        discount: 0,
        total: mixedSubtotal * 1.15 + 1000,
      },
    });

    console.log(`✅ Created 5 edge case scenarios (empty cart, single item, max discount, multi quantity, mixed prices)\n`);

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('═════════════════════════════════════════════════════════════════');
    console.log('📊 SEEDING SUMMARY');
    console.log('═════════════════════════════════════════════════════════════════');
    console.log(`✅ Products: ${products.length}`);
    console.log(`✅ Users: ${testUsers.length}`);
    console.log(`✅ Carts: ${allCarts.length}`);
    console.log(`   - Active user carts: ${userCarts.length}`);
    console.log(`   - Active guest carts: ${guestCarts.length}`);
    console.log(`   - Abandoned carts: ${abandonedCarts.length}`);
    console.log(`   - Converted carts: ${convertedCarts.length}`);
    console.log(`   - Expired carts: ${expiredCarts.length}`);
    console.log(`✅ Cart Items: ${totalCartItems}`);
    console.log(`✅ Cart Events: ${totalEvents}`);
    console.log(`✅ Cart Analytics: ${allCarts.filter(c => c.status !== 'expired').length}`);
    console.log(`✅ Edge Case Scenarios: 5`);
    console.log('═════════════════════════════════════════════════════════════════');
    console.log('🎉 Seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
