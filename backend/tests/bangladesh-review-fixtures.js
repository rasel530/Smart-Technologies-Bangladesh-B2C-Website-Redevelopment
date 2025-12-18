

/**
 * Bangladesh-Specific Review Test Data Fixtures
 * 
 * This file provides comprehensive test data fixtures specifically designed for
 * Bangladesh e-commerce review system including:
 * - Local product review patterns and sentiments
 * - Bangladesh-specific cultural context in reviews
 * - Regional language support (Bengali)
 * - Local festival and seasonal review patterns
 * - Market-specific rating distributions
 * - Cultural sentiment analysis data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Bangladesh Review Sentiment Categories
 */
const BANGLADESH_REVIEW_SENTIMENTS = {
  VERY_POSITIVE: {
    score: 5,
    keywords: ['অসাধারণ', 'excellent', 'amazing', 'perfect', 'সেরা', 'best', 'অসাধারণ', 'outstanding'],
    bengaliPhrases: ['অসাধারণ পণ্য', 'খুবই ভালো', 'সন্তুষ্ট', 'সুপারিশ করবো'],
    englishPhrases: ['Excellent product', 'Very good', 'Satisfied', 'Would recommend']
  },
  POSITIVE: {
    score: 4,
    keywords: ['ভালো', 'good', 'nice', 'satisfied', 'সন্তুষ্ট', 'decent', 'ভালোই', 'pleased'],
    bengaliPhrases: ['ভালো পণ্য', 'সন্তুষ্ট', 'মোটামুটি', 'গ্রহণযোগ্য'],
    englishPhrases: ['Good product', 'Satisfied', 'Acceptable', 'Decent quality']
  },
  NEUTRAL: {
    score: 3,
    keywords: ['ঠিকঠাক', 'okay', 'average', 'normal', 'মোটামুটি', 'so-so', 'গড়', 'fair'],
    bengaliPhrases: ['ঠিকঠাক', 'মোটামুটি', 'খারাপ না', 'গড়পত্তর'],
    englishPhrases: ['Okay', 'Average', 'Not bad', 'Fair enough']
  },
  NEGATIVE: {
    score: 2,
    keywords: ['খারাপ', 'bad', 'poor', 'disappointed', 'সমস্যা', 'issue', 'কম', 'disappointed'],
    bengaliPhrases: ['খারাপ পণ্য', 'সমস্যা হচ্ছে', 'মান নেই', 'সন্তুষ্ট না'],
    englishPhrases: ['Poor quality', 'Having issues', 'Low quality', 'Not satisfied']
  },
  VERY_NEGATIVE: {
    score: 1,
    keywords: ['ভয়ানক', 'terrible', 'awful', 'worst', 'সবচেয়ে খারাপ', 'useless', 'অকেজো', 'disaster'],
    bengaliPhrases: ['ভয়ানক পণ্য', 'একদমই খারাপ', 'অকেজো', 'ফেরত দিতে হবে'],
    englishPhrases: ['Terrible product', 'Worst ever', 'Useless', 'Need to return']
  }
};

/**
 * Bangladesh Product Categories with Review Patterns
 */
const BANGLADESH_REVIEW_CATEGORIES = {
  electronics: {
    name: 'Electronics',
    nameBn: 'ইলেকট্রনিক্স',
    reviewPatterns: {
      highTech: ['performance', 'battery', 'features', 'ব্যাটারি', 'ফিচার', 'পারফরম্যান্স'],
      durability: ['build quality', 'মান', 'স্থায়িত্ব', 'long lasting'],
      value: ['price', 'দাম', 'value for money', 'মূল্য'],
      service: ['warranty', 'service', 'ওয়ারেন্টি', 'সার্ভিস']
    },
    averageRating: 4.2,
    reviewFrequency: 'high'
  },
  clothing: {
    name: 'Clothing & Fashion',
    nameBn: 'পোশাক ওর ফ্যাশন',
    reviewPatterns: {
      fit: ['size', 'fit', 'সাইজ', 'ফিট', 'measurement'],
      quality: ['fabric', 'কাপড়', 'stitching', 'সেলাই', 'quality'],
      style: ['design', 'ডিজাইন', 'color', 'রং', 'style', 'স্টাইল'],
      value: ['price', 'দাম', 'worth', 'মূল্য']
    },
    averageRating: 3.8,
    reviewFrequency: 'medium'
  },
  food: {
    name: 'Food & Groceries',
    nameBn: 'খাদ্যাদ ওর নিত্যমাদ',
    reviewPatterns: {
      freshness: ['fresh', 'তাজা', 'expiry', 'মেয়াদ'],
      taste: ['taste', 'স্বাদ', 'flavor', 'গন্ধ'],
      packaging: ['packaging', 'প্যাকেজিং', 'sealed', 'সিল'],
      value: ['price', 'দাম', 'quantity', 'পরিমাণ']
    },
    averageRating: 4.0,
    reviewFrequency: 'high'
  },
  home: {
    name: 'Home & Living',
    nameBn: 'বাড়ি ওর জীবনসা',
    reviewPatterns: {
      durability: ['material', 'মান', 'sturdy', 'মজবুত'],
      design: ['design', 'ডিজাইন', 'look', 'দেখতে'],
      functionality: ['easy to use', 'ব্যবহার সহজ', 'convenient'],
      assembly: ['installation', 'ইনস্টলেশন', 'setup', 'সেটআপ']
    },
    averageRating: 3.9,
    reviewFrequency: 'medium'
  }
};

/**
 * Bangladesh Festival and Seasonal Review Patterns
 */
const BANGLADESH_SEASONAL_REVIEW_PATTERNS = {
  eidUlFitr: {
    name: 'Eid-ul-Fitr',
    nameBn: 'ঈদুল ফিতর',
    season: 'summer',
    products: ['clothing', 'electronics', 'gifts'],
    reviewTrends: {
      positive: 0.85,
      keywords: ['eid gift', 'ঈদ উপহার', 'festival', 'উৎসব', 'celebration', 'উদযাপন'],
      commonIssues: ['delivery delay', 'size issues', 'ডেলিভারি দেরি']
    }
  },
  eidUlAdha: {
    name: 'Eid-ul-Adha',
    nameBn: 'ঈদুল আজহা',
    season: 'monsoon',
    products: ['clothing', 'home', 'electronics'],
    reviewTrends: {
      positive: 0.82,
      keywords: ['qurbani', 'কোরবানি', 'family gathering', 'পরিবার', 'traditional'],
      commonIssues: ['weather damage', 'বৃষ্টির ক্ষতি', 'shipping issues']
    }
  },
  durgaPuja: {
    name: 'Durga Puja',
    nameBn: 'দুর্গা পূজা',
    season: 'autumn',
    products: ['clothing', 'home decor', 'electronics'],
    reviewTrends: {
      positive: 0.88,
      keywords: ['puja', 'পূজা', 'festival wear', 'উৎসবের পোশাক', 'traditional'],
      commonIssues: ['stock shortage', 'স্টক সংকট', 'high demand']
    }
  },
  winter: {
    name: 'Winter Season',
    nameBn: 'শীতকাল',
    season: 'winter',
    products: ['blankets', 'heaters', 'warm clothing'],
    reviewTrends: {
      positive: 0.79,
      keywords: ['warm', 'উষ্ণ', 'cozy', 'আরামদায়ক', 'winter essential'],
      commonIssues: ['power consumption', 'বিদ্যুৎ খরচ', 'size issues']
    }
  }
};

/**
 * Bangladesh Regional Review Patterns
 */
const BANGLADESH_REGIONAL_PATTERNS = {
  dhaka: {
    name: 'Dhaka Division',
    nameBn: 'ঢাকা বিভাগ',
    reviewCharacteristics: {
      language: 'mixed-bengali-english',
      techSavvy: 'high',
      expectations: 'high',
      commonPhrases: ['awesome', 'দারুন', 'perfect', 'চমৎকার'],
      focusAreas: ['brand reputation', 'latest features', 'trending']
    },
    averageRating: 3.9
  },
  chittagong: {
    name: 'Chittagong Division',
    nameBn: 'চট্টগ্রাম বিভাগ',
    reviewCharacteristics: {
      language: 'bengali-dominant',
      techSavvy: 'medium',
      expectations: 'medium',
      commonPhrases: ['ভালো', 'good', 'গ্রহণযোগ্য', 'acceptable'],
      focusAreas: ['durability', 'value for money', 'practicality']
    },
    averageRating: 4.1
  },
  sylhet: {
    name: 'Sylhet Division',
    nameBn: 'সিলেট বিভাগ',
    reviewCharacteristics: {
      language: 'bengali-sylheti',
      techSavvy: 'medium-low',
      expectations: 'medium',
      commonPhrases: ['ভালোই', 'nice', 'ঠিকআছে', 'fine'],
      focusAreas: ['simplicity', 'ease of use', 'traditional values']
    },
    averageRating: 4.0
  },
  rajshahi: {
    name: 'Rajshahi Division',
    nameBn: 'রাজশাহী বিভাগ',
    reviewCharacteristics: {
      language: 'bengali-pure',
      techSavvy: 'medium',
      expectations: 'practical',
      commonPhrases: ['কাজের', 'useful', 'মূল্যবান', 'valuable'],
      focusAreas: ['practicality', 'long-term value', 'agricultural relevance']
    },
    averageRating: 4.2
  }
};

/**
 * Bangladesh Review Templates
 */
const BANGLADESH_REVIEW_TEMPLATES = {
  smartphone: {
    positive: {
      title: 'অসাধারণ স্মার্টফোন! সুপারিশ করবো',
      titleEn: 'Amazing Smartphone! Highly Recommended',
      comment: 'এই ফোনটি কেনার পর খুবই খুশি। ক্যামেরা অসাধারণ, ব্যাটারি ব্যাকআপ ভালো, এবং পারফরম্যান্স দারুন। দামের তুলনায় অনেক ভালো ফিচার। বন্ধুদের সুপারিশ করবো।',
      commentEn: 'Very happy after buying this phone. Camera is amazing, battery backup is good, and performance is great. Lots of features for the price. Will recommend to friends.',
      rating: 5,
      helpfulCount: 24,
      images: ['phone-camera.jpg', 'phone-battery.jpg']
    },
    neutral: {
      title: 'মোটামুটি ফোন, কিছু সমস্যা আছে',
      titleEn: 'Decent phone, some issues',
      comment: 'ফোনটি মোটামুটি ভালো। ক্যামেরা ঠিকঠাক, কিন্তু ব্যাটারি দ্রুত শেষ হয়ে যায়। গেমিং করলে ফোন গরম হয়। দামটা আরেকটু কম হলে ভালো হতো।',
      commentEn: 'Phone is decent. Camera is okay, but battery drains quickly. Gets hot during gaming. Would be better if price was lower.',
      rating: 3,
      helpfulCount: 8
    },
    negative: {
      title: 'খারাপ অভিজ্ঞতা, ফেরত দিতে হবে',
      titleEn: 'Bad experience, need to return',
      comment: 'একদমই খারাপ পণ্য। কেনার এক সপ্তাহের মধ্যেই সমস্যা শুরু হলো। ফোন হ্যাং করে, ক্যামেরা ভালো না, ব্যাটারি খুবই খারাপ। ফেরত দেওয়ার চিন্তা করছি।',
      commentEn: 'Very bad product. Problems started within one week of purchase. Phone hangs, camera is not good, battery is very poor. Thinking of returning.',
      rating: 1,
      helpfulCount: 15
    }
  },
  traditionalClothing: {
    positive: {
      title: 'ঈদের জন্য নিখুঁত পোশাক!',
      titleEn: 'Perfect outfit for Eid!',
      comment: 'ঈদের জন্য এই শাড়িটা কিনেছিলাম। ডিজাইন অসাধারণ, কাপড়ের মান খুবই ভালো। পরিবারের সবাই পছন্দ করেছে। দামও মোটামুটি ছিল। সুপারিশ করবো।',
      commentEn: 'Bought this saree for Eid. Design is amazing, fabric quality is very good. Whole family liked it. Price was reasonable too. Will recommend.',
      rating: 5,
      helpfulCount: 32,
      images: ['saree-full.jpg', 'saree-detail.jpg']
    },
    neutral: {
      title: 'ভালো পণ্য, কিন্তু দাম একটু বেশি',
      titleEn: 'Good product, but price is a bit high',
      comment: 'শাড়িটা ভালো, ডিজাইন সুন্দর। কিন্তু দামটা একটু বেশি মনে হলো। কাপড়ের মান ঠিকঠাক, কিন্তু আরেকটু ভালো হতে পারতো। মোটামুটি সন্তুষ্ট।',
      commentEn: 'Saree is good, design is beautiful. But price seems a bit high. Fabric quality is okay, could be better. Moderately satisfied.',
      rating: 3,
      helpfulCount: 12
    }
  },
  electronics: {
    positive: {
      title: 'ল্যাপটপটি অসাধারণ, পারফরম্যান্স দারুন',
      titleEn: 'Laptop is amazing, performance is great',
      comment: 'অনলাইন ক্লাসের জন্য ল্যাপটপটি কিনেছি। পারফরম্যান্স দারুন, ব্যাটারি ব্যাকআপ ৬ ঘন্টা পায়। ওয়ালটনের পণ্য হওয়ায় সার্ভিসও ভালো। ছাত্রদের জন্য উপযুক্ত।',
      commentEn: 'Bought laptop for online classes. Performance is great, battery backup gives 6 hours. Being Walton product, service is also good. Suitable for students.',
      rating: 4,
      helpfulCount: 18
    }
  },
  food: {
    positive: {
      title: 'তাজা মসলা, স্বাদ অসাধারণ',
      titleEn: 'Fresh spices, amazing taste',
      comment: 'হলুদ গুঁড়াটা তাজা, স্বাদ খুবই ভালো। প্যাকেজিং ভালো, মেয়াদ আছে। রান্নায় ব্যবহার করে খুব খুশি। বারবার কিনবো।',
      commentEn: 'Turmeric powder is fresh, taste is very good. Packaging is good, has expiry date. Very happy using in cooking. Will buy again.',
      rating: 5,
      helpfulCount: 28
    }
  }
};

/**
 * Bangladesh User Review Profiles
 */
const BANGLADESH_USER_PROFILES = {
  techEnthusiast: {
    name: 'Rahim Ahmed',
    nameBn: 'রহিম আহমেদ',
    location: 'Dhaka',
    profession: 'Software Engineer',
    reviewStyle: {
      language: 'mixed-bengali-english',
      detailLevel: 'high',
      technicalFocus: true,
      commonPhrases: ['performance', 'specs', 'benchmark', 'value for money'],
      ratingDistribution: { 5: 0.6, 4: 0.3, 3: 0.08, 2: 0.02, 1: 0 }
    },
    reviewFrequency: 'weekly'
  },
  homemaker: {
    name: 'Fatema Begum',
    nameBn: 'ফাতেমা বেগম',
    location: 'Chittagong',
    profession: 'Homemaker',
    reviewStyle: {
      language: 'bengali-dominant',
      detailLevel: 'medium',
      practicalFocus: true,
      commonPhrases: ['family use', 'পরিবারের জন্য', 'easy to use', 'ব্যবহার সহজ'],
      ratingDistribution: { 5: 0.4, 4: 0.35, 3: 0.15, 2: 0.08, 1: 0.02 }
    },
    reviewFrequency: 'monthly'
  },
  student: {
    name: 'Karim Mia',
    nameBn: 'করিম মিয়া',
    location: 'Sylhet',
    profession: 'University Student',
    reviewStyle: {
      language: 'mixed',
      detailLevel: 'medium',
      budgetFocus: true,
      commonPhrases: ['budget friendly', 'দাম কম', 'student friendly', 'ছাত্রদের জন্য'],
      ratingDistribution: { 5: 0.3, 4: 0.4, 3: 0.2, 2: 0.08, 1: 0.02 }
    },
    reviewFrequency: 'bi-weekly'
  },
  businessOwner: {
    name: 'Abdul Rahman',
    nameBn: 'আব্দুল রহমান',
    location: 'Rajshahi',
    profession: 'Business Owner',
    reviewStyle: {
      language: 'bengali',
      detailLevel: 'low',
      qualityFocus: true,
      commonPhrases: ['মান ভালো', 'ব্যবসায় উপযোগী', 'দীর্ঘস্থায়ী'],
      ratingDistribution: { 5: 0.5, 4: 0.35, 3: 0.1, 2: 0.04, 1: 0.01 }
    },
    reviewFrequency: 'monthly'
  }
};

/**
 * Create Bangladesh-specific review test data
 */
async function createBangladeshReviewTestData() {
  const reviews = [];
  const users = [];
  const products = [];

  // Create test users with different profiles
  for (const [profileKey, profile] of Object.entries(BANGLADESH_USER_PROFILES)) {
    const user = await prisma.user.create({
      data: {
        email: `${profileKey.toLowerCase()}@test.com`,
        password: 'hashedpassword123',
        firstName: profile.name.split(' ')[0],
        lastName: profile.name.split(' ')[1] || 'Test',
        phone: `+8801${Math.floor(Math.random() * 900000000) + 100000000}`,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
    users.push({ ...profile, id: user.id });
  }

  // Create test products for review
  const productCategories = ['smartphone', 'traditionalClothing', 'electronics', 'food'];
  for (const category of productCategories) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: category === 'smartphone' ? 'Galaxy' : category === 'traditionalClothing' ? 'Saree' : category === 'electronics' ? 'Laptop' : 'Turmeric' } },
          { nameBn: { contains: category === 'smartphone' ? 'গ্যালাক্সি' : category === 'traditionalClothing' ? 'শাড়ি' : category === 'electronics' ? 'ল্যাপটপ' : 'হলুদ' } }
        ]
      }
    });

    if (product) {
      products.push({ category, id: product.id });
    }
  }

  // Create reviews for each user-product combination
  for (const user of users) {
    for (const product of products) {
      const templates = BANGLADESH_REVIEW_TEMPLATES[product.category];
      if (templates) {
        // Create multiple reviews with different sentiments
        for (const [sentiment, template] of Object.entries(templates)) {
          const rating = template.rating;
          
          // Apply user's rating distribution
          const shouldCreate = Math.random() < user.reviewStyle.ratingDistribution[rating];
          
          if (shouldCreate) {
            const review = await prisma.review.create({
              data: {
                productId: product.id,
                userId: user.id,
                rating,
                title: Math.random() > 0.5 ? template.title : template.titleEn,
                comment: Math.random() > 0.5 ? template.comment : template.commentEn,
                isVerified: Math.random() > 0.3,
                isApproved: Math.random() > 0.2,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
              }
            });
            
            reviews.push({
              ...template,
              id: review.id,
              user: user.name,
              location: user.location,
              category: product.category
            });
          }
        }
      }
    }
  }

  return { reviews, users, products };
}

/**
 * Generate seasonal review data
 */
function generateSeasonalReviews(season, count = 50) {
  const seasonPattern = BANGLADESH_SEASONAL_REVIEW_PATTERNS[season];
  if (!seasonPattern) return [];

  const reviews = [];
  const sentiments = Object.keys(BANGLADESH_REVIEW_SENTIMENTS);

  for (let i = 0; i < count; i++) {
    const isPositive = Math.random() < seasonPattern.reviewTrends.positive;
    const sentiment = isPositive ? 
      sentiments[Math.floor(Math.random() * 2)] : // VERY_POSITIVE or POSITIVE
      sentiments[Math.floor(Math.random() * 3) + 2]; // NEUTRAL, NEGATIVE, or VERY_NEGATIVE

    const sentimentData = BANGLADESH_REVIEW_SENTIMENTS[sentiment];
    const keywords = sentimentData.keywords[Math.floor(Math.random() * sentimentData.keywords.length)];
    const bengaliPhrase = sentimentData.bengaliPhrases[Math.floor(Math.random() * sentimentData.bengaliPhrases.length)];
    const englishPhrase = sentimentData.englishPhrases[Math.floor(Math.random() * sentimentData.englishPhrases.length)];

    reviews.push({
      rating: sentimentData.score,
      title: `${keywords} ${seasonPattern.name} পণ্য`,
      titleEn: `${keywords} ${seasonPattern.name} product`,
      comment: `${seasonPattern.name} এর জন্য এই পণ্যটি ${bengaliPhrase}। ${keywords}।`,
      commentEn: `This product for ${seasonPattern.name} is ${englishPhrase}. ${keywords}.`,
      season: season,
      sentiment: sentiment
    });
  }

  return reviews;
}

/**
 * Calculate regional rating distribution
 */
function calculateRegionalRatingDistribution(region) {
  const regionData = BANGLADESH_REGIONAL_PATTERNS[region];
  if (!regionData) return null;

  return {
    region: regionData.name,
    averageRating: regionData.averageRating,
    characteristics: regionData.reviewCharacteristics,
    expectedReviewVolume: region === 'dhaka' ? 'high' : region === 'chittagong' ? 'medium-high' : 'medium'
  };
}

/**
 * Mock sentiment analysis service
 */
function mockSentimentAnalysis(text) {
  const lowerText = text.toLowerCase();
  
  for (const [sentiment, data] of Object.entries(BANGLADESH_REVIEW_SENTIMENTS)) {
    for (const keyword of data.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          sentiment: sentiment,
          score: data.score,
          confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
          keywords: [keyword]
        };
      }
    }
  }

  // Default to neutral if no keywords found
  return {
    sentiment: 'NEUTRAL',
    score: 3,
    confidence: 0.5,
    keywords: []
  };
}

/**
 * Generate review analytics data
 */
function generateReviewAnalytics(reviews) {
  const analytics = {
    totalReviews: reviews.length,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    sentimentDistribution: {},
    seasonalTrends: {},
    regionalTrends: {},
    categoryTrends: {},
    verifiedReviews: 0,
    approvedReviews: 0
  };

  let totalRating = 0;
  
  reviews.forEach(review => {
    // Rating distribution
    analytics.ratingDistribution[review.rating]++;
    totalRating += review.rating;

    // Sentiment distribution
    const sentiment = mockSentimentAnalysis(review.comment);
    analytics.sentimentDistribution[sentiment.sentiment] = 
      (analytics.sentimentDistribution[sentiment.sentiment] || 0) + 1;

    // Verification and approval
    if (review.isVerified) analytics.verifiedReviews++;
    if (review.isApproved) analytics.approvedReviews++;

    // Seasonal trends
    if (review.season) {
      analytics.seasonalTrends[review.season] = 
        (analytics.seasonalTrends[review.season] || 0) + 1;
    }

    // Regional trends
    if (review.location) {
      analytics.regionalTrends[review.location] = 
        (analytics.regionalTrends[review.location] || 0) + 1;
    }

    // Category trends
    if (review.category) {
      analytics.categoryTrends[review.category] = 
        (analytics.categoryTrends[review.category] || 0) + 1;
    }
  });

  analytics.averageRating = totalRating / reviews.length;

  return analytics;
}

module.exports = {
  BANGLADESH_REVIEW_SENTIMENTS,
  BANGLADESH_REVIEW_CATEGORIES,
  BANGLADESH_SEASONAL_REVIEW_PATTERNS,
  BANGLADESH_REGIONAL_PATTERNS,
  BANGLADESH_REVIEW_TEMPLATES,
  BANGLADESH_USER_PROFILES,
  createBangladeshReviewTestData,
  generateSeasonalReviews,
  calculateRegionalRatingDistribution,
