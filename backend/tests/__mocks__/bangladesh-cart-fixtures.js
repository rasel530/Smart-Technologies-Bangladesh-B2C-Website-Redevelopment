/**
 * Bangladesh-Specific Cart Test Data Fixtures
 * 
 * This file provides comprehensive test data fixtures specifically designed for
 * Bangladesh e-commerce context including:
 * - Local product categories (electronics, clothing, food, etc.)
 * - Bangladesh-specific pricing in BDT
 * - Local brand names and products
 * - Division-based shipping configurations
 * - Local payment methods
 * - Cultural and regional considerations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Bangladesh Product Categories
 */
const BANGLADESH_CATEGORIES = {
  electronics: {
    name: 'Electronics',
    nameBn: 'ইলেকট্রনিক্স',
    slug: 'electronics',
    description: 'Mobile phones, laptops, computers, and electronic accessories',
    taxRate: 0.15, // 15% VAT
    subcategories: {
      mobile: {
        name: 'Mobile Phones',
        nameBn: 'মোবাইল ফোন',
        slug: 'mobile-phones'
      },
      laptop: {
        name: 'Laptops & Computers',
        nameBn: 'ল্যাপটপ ওর কম্পিউটার',
        slug: 'laptops-computers'
      },
      tv: {
        name: 'TV & Home Appliances',
        nameBn: 'টিভি ওর হোম এপ্লায়েন্স',
        slug: 'tv-home-appliances'
      },
      accessories: {
        name: 'Electronic Accessories',
        nameBn: 'ইলেকট্রনিক্স আনুসার',
        slug: 'electronic-accessories'
      }
    }
  },
  clothing: {
    name: 'Clothing & Fashion',
    nameBn: 'পোশাক ওর ফ্যাশন',
    slug: 'clothing-fashion',
    description: 'Traditional and modern clothing for all ages',
    taxRate: 0.10, // 10% VAT
    subcategories: {
      mens: {
        name: 'Men\'s Clothing',
        nameBn: 'পুরুষদের পোশাক',
        slug: 'mens-clothing'
      },
      womens: {
        name: 'Women\'s Clothing',
        nameBn: 'নারীদের পোশাক',
        slug: 'womens-clothing'
      },
      kids: {
        name: 'Kids Clothing',
        nameBn: 'শিশুদের পোশাক',
        slug: 'kids-clothing'
      },
      traditional: {
        name: 'Traditional Wear',
        nameBn: 'ঐতিহ্যাদিক পোশাক',
        slug: 'traditional-wear'
      }
    }
  },
  food: {
    name: 'Food & Groceries',
    nameBn: 'খাদ্যাদ ওর নিত্যমাদ',
    slug: 'food-groceries',
    description: 'Fresh produce, packaged foods, and household essentials',
    taxRate: 0.05, // 5% VAT or reduced rate
    subcategories: {
      fresh: {
        name: 'Fresh Produce',
        nameBn: 'সতেদা উৎপাদন',
        slug: 'fresh-produce'
      },
      packaged: {
        name: 'Packaged Foods',
        nameBn: 'প্যাকেজ খাব্যাদ',
        slug: 'packaged-foods'
      },
      beverages: {
        name: 'Beverages',
        nameBn: 'পানীয',
        slug: 'beverages'
      },
      spices: {
        name: 'Spices & Condiments',
        nameBn: 'মসলা মশলা',
        slug: 'spices-condiments'
      }
    }
  },
  home: {
    name: 'Home & Living',
    nameBn: 'বাড়ি ওর জীবনসা',
    slug: 'home-living',
    description: 'Furniture, decor, and household items',
    taxRate: 0.15, // 15% VAT
    subcategories: {
      furniture: {
        name: 'Furniture',
        nameBn: 'আসবাবনা',
        slug: 'furniture'
      },
      decor: {
        name: 'Home Decor',
        nameBn: 'বাড়ি সজাবন',
        slug: 'home-decor'
      },
      kitchen: {
        name: 'Kitchen & Dining',
        nameBn: 'রান্নঘর ওর খাবাব',
        slug: 'kitchen-dining'
      }
    }
  },
  books: {
    name: 'Books & Stationery',
    nameBn: 'বই ওর স্টেশনার',
    slug: 'books-stationery',
    description: 'Educational books, novels, and office supplies',
    taxRate: 0.05, // 5% VAT or reduced rate
    subcategories: {
      academic: {
        name: 'Academic Books',
        nameBn: 'শিক্ষাগত বই',
        slug: 'academic-books'
      },
      fiction: {
        name: 'Fiction & Literature',
        nameBn: 'কল্পনি ওর সাহিত্য',
        slug: 'fiction-literature'
      },
      stationery: {
        name: 'Stationery',
        nameBn: 'স্টেশনার',
        slug: 'stationery'
      }
    }
  }
};

/**
 * Bangladesh Divisions with Shipping Configurations
 */
const BANGLADESH_DIVISIONS = {
  DHAKA: {
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    code: 'DHAKA',
    shipping: {
      regular: 100,    // BDT
      express: 200,   // BDT
      sameDay: 300     // BDT
    },
    districts: [
      'Dhaka', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Manikganj',
      'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail', 'Faridpur', 'Madaripur'
    ]
  },
  CHITTAGONG: {
    name: 'Chittagong',
    nameBn: 'চট্টগ্রাম',
    code: 'CHITTAGONG',
    shipping: {
      regular: 150,    // BDT
      express: 250,   // BDT
      sameDay: 350     // BDT
    },
    districts: [
      'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', 'Feni', 'Khagrachari',
      'Lakshmipur', 'Noakhali', 'Rangamati', 'Rangunia'
    ]
  },
  RAJSHAHI: {
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    code: 'RAJSHAHI',
    shipping: {
      regular: 120,    // BDT
      express: 220,   // BDT
      sameDay: 320     // BDT
    },
    districts: [
      'Bogra', 'Jaipurhat', 'Naogaon', 'Natore', 'Nawabganj', 'Pabna', 'Pabna', 'Rajshahi', 'Sirajganj'
    ]
  },
  SYLHET: {
    name: 'Sylhet',
    nameBn: 'সিলেট',
    code: 'SYLHET',
    shipping: {
      regular: 130,    // BDT
      express: 230,   // BDT
      sameDay: 330     // BDT
    },
    districts: [
      'Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet', 'Moulvibazar'
    ]
  },
  KHULNA: {
    name: 'Khulna',
    nameBn: 'খুলনা',
    code: 'KHULNA',
    shipping: {
      regular: 140,    // BDT
      express: 240,   // BDT
      sameDay: 340     // BDT
    },
    districts: [
      'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira', 'Shatkhira'
    ]
  },
  BARISHAL: {
    name: 'Barishal',
    nameBn: 'বরিশাল',
    code: 'BARISHAL',
    shipping: {
      regular: 160,    // BDT
      express: 260,   // BDT
      sameDay: 360     // BDT
    },
    districts: [
      'Barguna', 'Barishal', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'
    ]
  },
  RANGPUR: {
    name: 'Rangpur',
    nameBn: 'রংপুর',
    code: 'RANGPUR',
    shipping: {
      regular: 170,    // BDT
      express: 270,   // BDT
      sameDay: 370     // BDT
    },
    districts: [
      'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Sirajganj', 'Thakurga'
    ]
  },
  MYMENSINGH: {
    name: 'Mymensingh',
    nameBn: 'ময়মনসিং',
    code: 'MYMENSINGH',
    shipping: {
      regular: 180,    // BDT
      express: 280,   // BDT
      sameDay: 380     // BDT
    },
    districts: [
      'Jamalpur', 'Mymensingh', 'Netrakona', 'Sherpur', 'Tangail'
    ]
  }
};

/**
 * Bangladesh Payment Methods
 */
const BANGLADESH_PAYMENT_METHODS = {
  CASH_ON_DELIVERY: {
    name: 'Cash on Delivery',
    nameBn: 'ক্যাশে প্রদানের সময়',
    code: 'CASH_ON_DELIVERY',
    fee: 0, // No fee
    description: 'Pay when you receive your order',
    popular: true
  },
  BKASH: {
    name: 'bKash',
    nameBn: 'বিকাশ',
    code: 'BKASH',
    fee: 0.018, // 1.8% fee
    description: 'Bangladesh\'s most popular mobile financial service',
    popular: true
  },
  NAGAD: {
    name: 'Nagad',
    nameBn: 'নগদ',
    code: 'NAGAD',
    fee: 0.018, // 1.8% fee
    description: 'Mobile financial service by Bangladesh Bank',
    popular: true
  },
  ROCKET: {
    name: 'Rocket',
    nameBn: 'রকেট',
    code: 'ROCKET',
    fee: 0.020, // 2.0% fee
    description: 'Mobile financial service by Dutch-Bangla Bank',
    popular: false
  },
  CARD: {
    name: 'Credit/Debit Card',
    nameBn: 'ক্রেডিট/ডেবিট কার্ড',
    code: 'CARD',
    fee: 0.025, // 2.5% fee
    description: 'International and local card payments',
    popular: false
  }
};

/**
 * Bangladesh-specific Product Templates
 */
const BANGLADESH_PRODUCT_TEMPLATES = {
  smartphone: {
    name: 'Samsung Galaxy A54',
    nameBn: 'স্যামসাং গ্যালাক্সি A54',
    category: 'mobile-phones',
    brand: 'Samsung',
    regularPrice: 45000, // BDT
    salePrice: 42000,   // BDT
    costPrice: 38000,    // BDT
    stockQuantity: 50,
    specifications: {
      display: '6.4 inches',
      ram: '6GB',
      storage: '128GB',
      camera: '50MP + 12MP + 5MP',
      battery: '5000mAh',
      network: '5G',
      warranty: '12 months'
    },
    images: [
      'https://example.com/images/galaxy-a54-1.jpg',
      'https://example.com/images/galaxy-a54-2.jpg'
    ]
  },
  laptop: {
    name: 'Walton Executive Laptop',
    nameBn: 'ওয়ালটন এক্সিকিউটিভ ল্যাপটপ',
    category: 'laptops-computers',
    brand: 'Walton',
    regularPrice: 65000, // BDT
    salePrice: 58000,   // BDT
    costPrice: 48000,    // BDT
    stockQuantity: 30,
    specifications: {
      processor: 'Intel Core i5',
      ram: '8GB DDR4',
      storage: '512GB SSD',
      display: '15.6 inches Full HD',
      graphics: 'Integrated Intel HD',
      battery: '6 hours',
      warranty: '24 months'
    },
    images: [
      'https://example.com/images/walton-laptop-1.jpg'
    ]
  },
  traditionalClothing: {
    name: 'Handloom Silk Saree',
    nameBn: 'হস্তিত মসলাম শাড়ি',
    category: 'traditional-wear',
    brand: 'Local Artisan',
    regularPrice: 3500, // BDT
    salePrice: null,
    costPrice: 2000, // BDT
    stockQuantity: 20,
    specifications: {
      material: 'Pure Silk',
      length: '6 yards',
      work: 'Hand-woven',
      origin: 'Rajshahi',
      occasion: 'Festival wear',
      care: 'Dry clean only'
    },
    images: [
      'https://example.com/images/silk-saree-1.jpg',
      'https://example.com/images/silk-saree-2.jpg'
    ]
  },
  spices: {
    name: 'Premium Turmeric Powder',
    nameBn: 'হলুদ গুঁড়া গুঁড়া',
    category: 'spices-condiments',
    brand: 'Local Spices',
    regularPrice: 150, // BDT
    salePrice: null,
    costPrice: 80, // BDT
    stockQuantity: 100,
    specifications: {
      weight: '250g',
      purity: '100% Pure',
      origin: 'Chittagong',
      processing: 'Sun-dried',
      packaging: 'Food grade',
      shelfLife: '12 months'
    },
    images: [
      'https://example.com/images/turmeric-1.jpg'
    ]
  },
  book: {
    name: 'Bangladesh History Collection',
    nameBn: 'বাংলাদেশ ইতিহাস সংগ্রহ',
    category: 'academic-books',
    brand: 'Local Publisher',
    regularPrice: 450, // BDT
    salePrice: 350, // BDT
    costPrice: 250, // BDT
    stockQuantity: 50,
    specifications: {
      author: 'Various Bangladeshi Historians',
      pages: 450,
      language: 'Bengali',
      binding: 'Hardcover',
      isbn: '978-984-123-4567',
      edition: '2nd Edition'
    },
    images: [
      'https://example.com/images/bd-history-1.jpg'
    ]
  }
};

/**
 * Bangladesh-specific Cart Scenarios
 */
const BANGLADESH_CART_SCENARIOS = {
  festivalShopping: {
    name: 'Eid Festival Shopping',
    description: 'Customers shopping heavily during Eid festivals',
    products: [
      BANGLADESH_PRODUCT_TEMPLATES.smartphone,
      BANGLADESH_PRODUCT_TEMPLATES.traditionalClothing,
      BANGLADESH_PRODUCT_TEMPLATES.laptop
    ],
    expectedBehavior: {
      highValuePurchases: true,
      quantityBulkBuying: true,
      giftWrappingRequests: true,
      expressShippingDemand: true
    }
  },
  weddingSeason: {
    name: 'Wedding Season Shopping',
    description: 'Peak shopping season for weddings',
    products: [
      BANGLADESH_PRODUCT_TEMPLATES.traditionalClothing,
      BANGLADESH_PRODUCT_TEMPLATES.smartphone
    ],
    expectedBehavior: {
      highValuePurchases: true,
      bulkDiscountRequests: true,
      scheduledDelivery: true,
      giftRegistryIntegration: true
    }
  },
  backToSchool: {
    name: 'Back to School Season',
    description: 'Parents buying supplies for new school year',
    products: [
      BANGLADESH_PRODUCT_TEMPLATES.laptop,
      BANGLADESH_PRODUCT_TEMPLATES.book
    ],
    expectedBehavior: {
      budgetConsciousShopping: true,
      quantityComparison: true,
      bundleDeals: true,
      parentChildCoordination: true
    }
  },
  winterPreparation: {
    name: 'Winter Preparation',
    description: 'Customers preparing for winter season',
    products: [
      BANGLADESH_PRODUCT_TEMPLATES.blanket,
      BANGLADESH_PRODUCT_TEMPLATES.heater,
      BANGLADESH_PRODUCT_TEMPLATES.warmClothing
    ],
    expectedBehavior: {
      seasonalPurchases: true,
      earlyBirdDiscounts: true,
      stockPilingBehavior: true
    }
  }
};

/**
 * Create Bangladesh-specific test products
 */
async function createBangladeshProducts() {
  const products = [];
  
  for (const [key, template] of Object.entries(BANGLADESH_PRODUCT_TEMPLATES)) {
    const category = await prisma.category.findFirst({
      where: { slug: template.category }
    });

    if (!category) {
      const newCategory = await prisma.category.create({
        data: {
          name: BANGLADESH_CATEGORIES[template.category.split('-')[0]].name,
          slug: template.category,
          description: `Auto-created category for ${template.category}`,
          isActive: true
        }
      });
      template.categoryId = newCategory.id;
    }

    const brand = await prisma.brand.findFirst({
      where: { slug: template.brand?.toLowerCase() || 'unknown' }
    });

    if (!brand && template.brand) {
      const newBrand = await prisma.brand.create({
        data: {
          name: template.brand,
          slug: template.brand?.toLowerCase() || 'unknown',
          description: `Auto-created brand for ${template.brand}`,
          isActive: true
        }
      });
      template.brandId = newBrand.id;
    }

    const product = await prisma.product.create({
      data: {
        sku: `BD-${template.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
        name: template.name,
        nameEn: template.name,
        nameBn: template.nameBn,
        slug: template.name.replace(/\s+/g, '-').toLowerCase(),
        shortDescription: `${template.name} - Bangladesh Market`,
        description: `High-quality ${template.name} for Bangladeshi customers`,
        categoryId: template.categoryId,
        brandId: template.brandId,
        regularPrice: template.regularPrice,
        salePrice: template.salePrice,
        costPrice: template.costPrice,
        stockQuantity: template.stockQuantity,
        status: 'ACTIVE',
        taxRate: BANGLADESH_CATEGORIES[template.category.split('-')[0]].taxRate,
        warrantyPeriod: template.specifications?.warranty || 12,
        warrantyType: 'Manufacturer Warranty',
        isFeatured: Math.random() > 0.7,
        isNewArrival: Math.random() > 0.8,
        isBestSeller: Math.random() > 0.6
      }
    });

    // Create product images
    if (template.images) {
      for (let i = 0; i < template.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: template.images[i],
            alt: `${template.name} - Image ${i + 1}`,
            sortOrder: i
          }
        });
      }
    }

    // Create product specifications
    if (template.specifications) {
      for (const [specKey, specValue] of Object.entries(template.specifications)) {
        await prisma.productSpecification.create({
          data: {
            productId: product.id,
            name: specKey,
            value: String(specValue),
            sortOrder: 0
          }
        });
      }
    }

    products.push({ ...template, id: product.id });
  }

  return products;
}

/**
 * Create test cart with Bangladesh-specific items
 */
async function createBangladeshCart(user, products = []) {
  const cart = await prisma.cart.create({
    data: {
      userId: user?.id || null,
      sessionId: user ? null : `guest-session-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  // Add products to cart
  for (const product of products) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: product.regularPrice,
        totalPrice: product.regularPrice * (Math.floor(Math.random() * 3) + 1)
      }
    });
  }

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              brand: true,
              images: true,
              specifications: true
            }
          }
        }
      }
    }
  });
}

/**
 * Calculate Bangladesh-specific shipping costs
 */
function calculateBangladeshShipping(division, weight, express = false) {
  const divisionConfig = BANGLADESH_DIVISIONS[division];
  if (!divisionConfig) {
    throw new Error(`Unknown division: ${division}`);
  }

  let baseShipping = divisionConfig.shipping.regular;
  if (express) {
    baseShipping = divisionConfig.shipping.express;
  }

  // Add weight-based surcharge
  const weightSurcharge = weight > 5 ? Math.floor((weight - 5) * 10) : 0;

  return baseShipping + weightSurcharge;
}

/**
 * Calculate Bangladesh-specific tax
 */
function calculateBangladeshTax(product, quantity) {
  const price = parseFloat(product.regularPrice) * quantity;
  
  // Get category-specific tax rate
  let taxRate = 0.15; // Default 15%
  if (product.category && BANGLADESH_CATEGORIES[product.category.slug]) {
    taxRate = BANGLADESH_CATEGORIES[product.category.slug].taxRate;
  }

  return price * taxRate;
}

/**
 * Format price in BDT
 */
function formatBDTPrice(amount) {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
}

module.exports = {
  BANGLADESH_CATEGORIES,
  BANGLADESH_DIVISIONS,
  BANGLADESH_PAYMENT_METHODS,
  BANGLADESH_PRODUCT_TEMPLATES,
  BANGLADESH_CART_SCENARIOS,
  createBangladeshProducts,
  createBangladeshCart,
  calculateBangladeshShipping,
  calculateBangladeshTax,
  formatBDTPrice
};