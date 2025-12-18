/**
 * Bangladesh-Specific Wishlist Test Data Fixtures
 * 
 * This file provides comprehensive test data fixtures specifically designed for
 * Bangladesh e-commerce wishlist context including:
 * - Local product categories and cultural preferences
 * - Festival-based wishlist scenarios (Eid, Pohela Boishakh, etc.)
 * - Bangladesh-specific pricing in BDT
 * - Local brand names and products
 * - Regional gift-giving traditions
 * - Seasonal shopping patterns
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Bangladesh Festival-Based Wishlist Categories
 */
const BANGLADESH_FESTIVAL_WISHLISTS = {
  eidUlFitr: {
    name: 'Eid-ul-Fitr Gifts',
    nameBn: 'ঈদ-উল-ফিতর উপহার',
    description: 'Gift ideas for Eid-ul-Fitr celebration',
    season: 'summer',
    typicalBudget: {
      low: 500,      // BDT
      medium: 2000,  // BDT
      high: 10000    // BDT
    },
    targetAudience: ['family', 'friends', 'colleagues'],
    popularProducts: ['electronics', 'clothing', 'home-appliances']
  },
  eidUlAdha: {
    name: 'Eid-ul-Adha Essentials',
    nameBn: 'ঈদ-উল-আজহা সামগ্রী',
    description: 'Essential items for Eid-ul-Adha',
    season: 'summer',
    typicalBudget: {
      low: 1000,     // BDT
      medium: 5000,   // BDT
      high: 25000    // BDT
    },
    targetAudience: ['family', 'charity', 'community'],
    popularProducts: ['clothing', 'food-items', 'kitchen-appliances']
  },
  pohelaBoishakh: {
    name: 'Pohela Boishakh Celebration',
    nameBn: 'পহেলা বৈশাখ উদযাপন',
    description: 'Bengali New Year celebration items',
    season: 'spring',
    typicalBudget: {
      low: 300,      // BDT
      medium: 1500,  // BDT
      high: 8000     // BDT
    },
    targetAudience: ['family', 'cultural-events', 'personal'],
    popularProducts: ['traditional-clothing', 'books', 'decorations']
  },
  durgaPuja: {
    name: 'Durga Puja Festival',
    nameBn: 'দুর্গা পূজা উৎসব',
    description: 'Items for Durga Puja celebration',
    season: 'autumn',
    typicalBudget: {
      low: 800,      // BDT
      medium: 3000,  // BDT
      high: 15000    // BDT
    },
    targetAudience: ['family', 'religious-events', 'community'],
    popularProducts: ['traditional-clothing', 'sweets', 'decorations']
  },
  winterWedding: {
    name: 'Winter Wedding Season',
    nameBn: 'শীতকালীন বিবাহ মরসুম',
    description: 'Wedding gifts and essentials',
    season: 'winter',
    typicalBudget: {
      low: 2000,     // BDT
      medium: 8000,  // BDT
      high: 50000    // BDT
    },
    targetAudience: ['wedding-couples', 'family', 'close-friends'],
    popularProducts: ['jewelry', 'electronics', 'home-appliances', 'clothing']
  }
};

/**
 * Bangladesh-Specific Wishlist Product Templates
 */
const BANGLADESH_WISHLIST_PRODUCTS = {
  // Electronics
  smartphone: {
    name: 'Samsung Galaxy A54 5G',
    nameBn: 'স্যামসাং গ্যালাক্সি A54 5G',
    category: 'electronics',
    subcategory: 'mobile-phones',
    brand: 'Samsung',
    regularPrice: 45000,    // BDT
    salePrice: 42000,       // BDT
    costPrice: 38000,       // BDT
    stockQuantity: 50,
    popularity: 'high',
    culturalRelevance: 'Popular gift for Eid and weddings',
    specifications: {
      display: '6.4 inches Super AMOLED',
      ram: '6GB',
      storage: '128GB',
      camera: '50MP + 12MP + 5MP',
      battery: '5000mAh',
      network: '5G',
      warranty: '12 months manufacturer warranty'
    }
  },
  laptop: {
    name: 'Walton Prelude Pro',
    nameBn: 'ওয়ালটন প্রিলুড প্রো',
    category: 'electronics',
    subcategory: 'laptops',
    brand: 'Walton',
    regularPrice: 65000,    // BDT
    salePrice: 58000,       // BDT
    costPrice: 48000,       // BDT
    stockQuantity: 30,
    popularity: 'medium',
    culturalRelevance: 'Educational gift for students',
    specifications: {
      processor: 'Intel Core i5-12th Gen',
      ram: '8GB DDR4',
      storage: '512GB SSD',
      display: '15.6 inches Full HD',
      graphics: 'Intel Iris Xe',
      battery: '6 hours backup',
      warranty: '24 months warranty'
    }
  },
  
  // Traditional Clothing
  jamdaniSaree: {
    name: 'Handloom Jamdani Saree',
    nameBn: 'হস্তিত জামদানি শাড়ি',
    category: 'clothing',
    subcategory: 'traditional-wear',
    brand: 'Bangladesh Handloom',
    regularPrice: 8500,     // BDT
    salePrice: null,
    costPrice: 4500,        // BDT
    stockQuantity: 15,
    popularity: 'high',
    culturalRelevance: 'Traditional gift for Eid and weddings',
    specifications: {
      material: '100% Cotton Jamdani',
      length: '6 yards',
      work: 'Hand-woven traditional motifs',
      origin: 'Dhaka',
      occasion: 'Festival and wedding wear',
      care: 'Dry clean only',
      authenticity: 'GI tagged product'
    }
  },
  panjabi: {
    name: 'Men\'s Traditional Panjabi',
    nameBn: 'পুরুষদের ঐতিহ্যবাহী পাঞ্জাবী',
    category: 'clothing',
    subcategory: 'traditional-wear',
    brand: 'Aarong',
    regularPrice: 3200,     // BDT
    salePrice: 2800,        // BDT
    costPrice: 1800,        // BDT
    stockQuantity: 40,
    popularity: 'high',
    culturalRelevance: 'Eid and Pohela Boishakh essential',
    specifications: {
      material: 'Cotton blend',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Cream', 'Light Blue', 'Maroon'],
      embroidery: 'Traditional hand embroidery',
      care: 'Hand wash recommended'
    }
  },
  
  // Home & Living
  riceCooker: {
    name: 'Electric Rice Cooker',
    nameBn: 'বৈদ্যুতিক রাইস কুকার',
    category: 'home-appliances',
    subcategory: 'kitchen',
    brand: 'Vision',
    regularPrice: 3500,     // BDT
    salePrice: 3200,        // BDT
    costPrice: 2200,        // BDT
    stockQuantity: 60,
    popularity: 'medium',
    culturalRelevance: 'Essential for Bangladeshi households',
    specifications: {
      capacity: '1.8 liters',
      power: '700W',
      features: ['Auto keep warm', 'Non-stick pot', 'Steam tray'],
      warranty: '12 months'
    }
  },
  
  // Books & Stationery
  banglaNovel: {
    name: 'Humayun Ahmed Collection',
    nameBn: 'হুমায়ূন আহমেদ সংগ্রহ',
    category: 'books',
    subcategory: 'fiction',
    brand: 'Anyaprokash',
    regularPrice: 450,      // BDT
    salePrice: 380,         // BDT
    costPrice: 250,         // BDT
    stockQuantity: 100,
    popularity: 'high',
    culturalRelevance: 'Popular Bengali literature',
    specifications: {
      author: 'Humayun Ahmed',
      language: 'Bengali',
      pages: 320,
      binding: 'Paperback',
      isbn: '978-984-502-1234'
    }
  },
  
  // Food & Groceries
  dates: {
    name: 'Premium Saudi Dates',
    nameBn: 'প্রিমিয়াম সৌদি খেজুর',
    category: 'food',
    subcategory: 'dry-fruits',
    brand: 'Imported Foods',
    regularPrice: 1200,     // BDT per kg
    salePrice: 1000,        // BDT
    costPrice: 800,         // BDT
    stockQuantity: 200,
    popularity: 'seasonal',
    culturalRelevance: 'Essential for Ramadan and Eid',
    specifications: {
      origin: 'Saudi Arabia',
      variety: 'Ajwa dates',
      packaging: 'Food grade packaging',
      shelfLife: '12 months',
      weight: '1kg pack'
    }
  },
  
  // Jewelry
  goldNecklace: {
    name: '22K Gold Necklace',
    nameBn: '২২ ক্যারেট স্বর্ণের হার',
    category: 'jewelry',
    subcategory: 'gold',
    brand: 'Aarong Gold',
    regularPrice: 85000,    // BDT
    salePrice: null,
    costPrice: 75000,      // BDT
    stockQuantity: 5,
    popularity: 'high',
    culturalRelevance: 'Traditional wedding gift',
    specifications: {
      purity: '22K gold',
      weight: '5 grams',
      design: 'Traditional Bengali design',
      certification: 'BIS hallmark',
      warranty: 'Lifetime polishing service'
    }
  }
};

/**
 * Bangladesh Wishlist User Personas
 */
const BANGLADESH_WISHLIST_USERS = {
  urbanProfessional: {
    name: 'Rahim Khan',
    email: 'rahim.khan@example.com',
    phone: '+8801712345678',
    age: 32,
    location: 'Dhaka',
    occupation: 'Software Engineer',
    incomeLevel: 'high',
    shoppingPreferences: {
      categories: ['electronics', 'books', 'home-appliances'],
      priceRange: 'medium-to-high',
      brands: ['Samsung', 'Walton', 'Apple'],
      shoppingFrequency: 'weekly'
    },
    wishlistBehavior: {
      averageItems: 15,
      sharingFrequency: 'monthly',
      notificationPreferences: ['price-drops', 'stock-alerts'],
      seasonalShopping: ['Eid', 'Pohela Boishakh']
    }
  },
  student: {
    name: 'Fatema Akter',
    email: 'fatema.akter@example.com',
    phone: '+8801812345678',
    age: 21,
    location: 'Chittagong',
    occupation: 'University Student',
    incomeLevel: 'low',
    shoppingPreferences: {
      categories: ['books', 'electronics', 'clothing'],
      priceRange: 'low-to-medium',
      brands: ['Walton', 'Local Brands'],
      shoppingFrequency: 'monthly'
    },
    wishlistBehavior: {
      averageItems: 8,
      sharingFrequency: 'rarely',
      notificationPreferences: ['price-drops'],
      seasonalShopping: ['Back to School', 'Eid']
    }
  },
  homemaker: {
    name: 'Shamima Begum',
    email: 'shamima.begum@example.com',
    phone: '+8801912345678',
    age: 38,
    location: 'Sylhet',
    occupation: 'Homemaker',
    incomeLevel: 'medium',
    shoppingPreferences: {
      categories: ['home-appliances', 'clothing', 'food'],
      priceRange: 'medium',
      brands: ['Vision', 'Aarong', 'Local'],
      shoppingFrequency: 'bi-weekly'
    },
    wishlistBehavior: {
      averageItems: 20,
      sharingFrequency: 'weekly',
      notificationPreferences: ['price-drops', 'new-arrivals', 'festival-deals'],
      seasonalShopping: ['Eid', 'Winter', 'Wedding Season']
    }
  },
  smallBusinessOwner: {
    name: 'Karim Uddin',
    email: 'karim.uddin@example.com',
    phone: '+8801312345678',
    age: 45,
    location: 'Rajshahi',
    occupation: 'Small Business Owner',
    incomeLevel: 'high',
    shoppingPreferences: {
      categories: ['electronics', 'jewelry', 'gifts'],
      priceRange: 'high',
      brands: ['Premium Brands', 'International'],
      shoppingFrequency: 'monthly'
    },
    wishlistBehavior: {
      averageItems: 25,
      sharingFrequency: 'frequently',
      notificationPreferences: ['all'],
      seasonalShopping: ['All Festivals', 'Corporate Gifts']
    }
  }
};

/**
 * Bangladesh Wishlist Scenarios
 */
const BANGLADESH_WISHLIST_SCENARIOS = {
  eidPreparation: {
    name: 'Eid Festival Preparation',
    description: 'Users preparing for Eid celebrations',
    timeline: '1 month before Eid',
    userBehavior: {
      highActivity: true,
      priceComparison: true,
      bulkBuying: true,
      giftPlanning: true
    },
    expectedProducts: ['clothing', 'electronics', 'home-appliances', 'jewelry'],
    priceSensitivity: 'medium',
    urgencyLevel: 'high'
  },
  weddingGiftRegistry: {
    name: 'Wedding Gift Registry',
    description: 'Creating wishlists for wedding gifts',
    timeline: '2-3 months before wedding',
    userBehavior: {
      collaborativePlanning: true,
      highValueItems: true,
      brandPreference: true,
      sharingWithFamily: true
    },
    expectedProducts: ['jewelry', 'electronics', 'home-appliances', 'furniture'],
    priceSensitivity: 'low',
    urgencyLevel: 'medium'
  },
  studentBackToSchool: {
    name: 'Back to School Shopping',
    description: 'Students preparing for academic year',
    timeline: '1 month before school starts',
    userBehavior: {
      budgetConscious: true,
      practicalPurchases: true,
      parentInvolvement: true,
      comparisonShopping: true
    },
    expectedProducts: ['laptops', 'books', 'stationery', 'backpacks'],
    priceSensitivity: 'high',
    urgencyLevel: 'medium'
  },
  winterPreparation: {
    name: 'Winter Season Preparation',
    description: 'Households preparing for winter',
    timeline: 'November-December',
    userBehavior: {
      seasonalPurchases: true,
      homeImprovement: true,
      familyPlanning: true,
      earlyBirdDiscounts: true
    },
    expectedProducts: ['heaters', 'blankets', 'warm-clothing', 'kitchen-appliances'],
    priceSensitivity: 'medium',
    urgencyLevel: 'medium'
  }
};

/**
 * Create Bangladesh-specific wishlist test products
 */
async function createBangladeshWishlistProducts() {
  const products = [];
  
  for (const [key, template] of Object.entries(BANGLADESH_WISHLIST_PRODUCTS)) {
    // Find or create category
    const category = await prisma.category.findFirst({
      where: { slug: template.subcategory || template.category }
    });

    let categoryId;
    if (!category) {
      const newCategory = await prisma.category.create({
        data: {
          name: template.category,
          slug: template.subcategory || template.category,
          description: `Auto-created category for ${template.category}`,
          isActive: true
        }
      });
      categoryId = newCategory.id;
    } else {
      categoryId = category.id;
    }

    // Find or create brand
    const brand = await prisma.brand.findFirst({
      where: { slug: template.brand?.toLowerCase().replace(/\s+/g, '-') || 'unknown' }
    });

    let brandId;
    if (!brand && template.brand) {
      const newBrand = await prisma.brand.create({
        data: {
          name: template.brand,
          slug: template.brand?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          description: `Auto-created brand for ${template.brand}`,
          isActive: true
        }
      });
      brandId = newBrand.id;
    } else if (brand) {
      brandId = brand.id;
    }

    const product = await prisma.product.create({
      data: {
        sku: `BD-WL-${template.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
        name: template.name,
        nameEn: template.name,
        nameBn: template.nameBn,
        slug: template.name.replace(/\s+/g, '-').toLowerCase(),
        shortDescription: `${template.name} - Popular in Bangladesh`,
        description: `High-quality ${template.name} for Bangladeshi customers. ${template.culturalRelevance}`,
        categoryId,
        brandId,
        regularPrice: template.regularPrice,
        salePrice: template.salePrice,
        costPrice: template.costPrice,
        stockQuantity: template.stockQuantity,
        status: 'ACTIVE',
        taxRate: 0.15, // Standard 15% VAT
        warrantyPeriod: template.specifications?.warranty || 12,
        warrantyType: 'Manufacturer Warranty',
        isFeatured: template.popularity === 'high',
        isNewArrival: false,
        isBestSeller: template.popularity === 'high'
      }
    });

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
 * Create Bangladesh-specific wishlist user
 */
async function createBangladeshWishlistUser(personaKey) {
  const persona = BANGLADESH_WISHLIST_USERS[personaKey];
  if (!persona) {
    throw new Error(`Unknown persona: ${personaKey}`);
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('test123456', 10);

  const user = await prisma.user.create({
    data: {
      email: persona.email,
      password: hashedPassword,
      firstName: persona.name.split(' ')[0],
      lastName: persona.name.split(' ')[1] || '',
      phone: persona.phone,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    }
  });

  return { ...persona, id: user.id };
}

/**
 * Create festival-based wishlist
 */
async function createFestivalWishlist(userId, festivalKey, products = []) {
  const festival = BANGLADESH_FESTIVAL_WISHLISTS[festivalKey];
  if (!festival) {
    throw new Error(`Unknown festival: ${festivalKey}`);
  }

  const wishlist = await prisma.wishlist.create({
    data: {
      userId,
      name: festival.name,
      isPrivate: false
    }
  });

  // Add products to wishlist
  for (const product of products) {
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: product.id
      }
    });
  }

  return prisma.wishlist.findUnique({
    where: { id: wishlist.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
}

/**
 * Calculate Bangladesh-specific wishlist metrics
 */
function calculateWishlistMetrics(wishlist) {
  const totalItems = wishlist.items.length;
  const totalValue = wishlist.items.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.regularPrice;
    return sum + parseFloat(price);
  }, 0);
  
  const averageItemPrice = totalItems > 0 ? totalValue / totalItems : 0;
  const highValueItems = wishlist.items.filter(item => {
    const price = item.product.salePrice || item.product.regularPrice;
    return parseFloat(price) > 5000; // BDT 5000 threshold
  }).length;

  return {
    totalItems,
    totalValue,
    averageItemPrice,
    highValueItems,
    currency: 'BDT'
  };
}

/**
 * Format price in BDT with Bengali numerals option
 */
function formatBDTPrice(amount, useBengaliNumerals = false) {
  if (useBengaliNumerals) {
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const formatted = new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(amount);
    
    return formatted;
  }
  
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
}

module.exports = {
  BANGLADESH_FESTIVAL_WISHLISTS,
  BANGLADESH_WISHLIST_PRODUCTS,
  BANGLADESH_WISHLIST_USERS,
  BANGLADESH_WISHLIST_SCENARIOS,
  createBangladeshWishlistProducts,
  createBangladeshWishlistUser,
  createFestivalWishlist,
  calculateWishlistMetrics,
  formatBDTPrice
};