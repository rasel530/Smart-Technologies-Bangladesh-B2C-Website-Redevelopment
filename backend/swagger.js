const swaggerJsdoc = require('swagger-jsdoc');
const configService = require('./services/config');

class SwaggerService {
  constructor() {
    this.config = configService;
  }

  generateSwaggerSpec() {
    return {
      swaggerDefinition: {
        info: {
          title: 'Smart Technologies Bangladesh B2C E-commerce API',
          version: '1.0.0',
          description: 'Complete e-commerce API for Smart Technologies Bangladesh with product catalog, user management, orders, and payment processing',
          contact: {
            name: 'Smart Technologies Bangladesh',
            email: 'api@smarttechnologies.bd',
            url: 'https://smarttechnologies.bd'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        host: this.config.get('NODE_ENV') === 'production' 
          ? 'api.smarttechnologies.bd' 
          : 'localhost:3001',
        basePath: '/api/v1',
        schemes: ['https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          BearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT Bearer token for authentication'
          }
        },
        security: [
          {
            BearerAuth: []
          }
        ]
      },
      apis: [
        {
          path: '/auth',
          description: 'Authentication endpoints',
          operations: [
            {
              method: 'POST',
              path: '/register',
              summary: 'Register new user',
              description: 'Create a new user account',
              tags: ['Authentication'],
              parameters: [
                {
                  name: 'user',
                  in: 'body',
                  required: true,
                  description: 'User registration data',
                  schema: {
                    $ref: '#/definitions/UserRegistration'
                  }
                }
              ],
              responses: {
                '201': {
                  description: 'User registered successfully',
                  schema: {
                    $ref: '#/definitions/UserResponse'
                  }
                },
                '400': {
                  description: 'Validation error',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                },
                '409': {
                  description: 'User already exists',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            },
            {
              method: 'POST',
              path: '/login',
              summary: 'User login',
              description: 'Authenticate user and get JWT token',
              tags: ['Authentication'],
              parameters: [
                {
                  name: 'credentials',
                  in: 'body',
                  required: true,
                  description: 'User login credentials',
                  schema: {
                    $ref: '#/definitions/LoginCredentials'
                  }
                }
              ],
              responses: {
                '200': {
                  description: 'Login successful',
                  schema: {
                    $ref: '#/definitions/LoginResponse'
                  }
                },
                '401': {
                  description: 'Invalid credentials',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            },
            {
              method: 'POST',
              path: '/refresh',
              summary: 'Refresh JWT token',
              description: 'Refresh expired JWT token',
              tags: ['Authentication'],
              parameters: [
                {
                  name: 'token',
                  in: 'body',
                  required: true,
                  description: 'Expired JWT token',
                  schema: {
                    type: 'string'
                  }
                }
              ],
              responses: {
                '200': {
                  description: 'Token refreshed successfully',
                  schema: {
                    $ref: '#/definitions/LoginResponse'
                  }
                },
                '401': {
                  description: 'Invalid token',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            }
          ]
        },
        {
          path: '/users',
          description: 'User management endpoints',
          operations: [
            {
              method: 'GET',
              path: '/',
              summary: 'Get all users',
              description: 'Retrieve list of users with pagination and filtering',
              tags: ['Users'],
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  type: 'integer',
                  description: 'Page number',
                  default: 1
                },
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of users per page',
                  default: 20
                },
                {
                  name: 'search',
                  in: 'query',
                  type: 'string',
                  description: 'Search users by name or email'
                }
              ],
              responses: {
                '200': {
                  description: 'Users retrieved successfully',
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          $ref: '#/definitions/User'
                        }
                      },
                      pagination: {
                        $ref: '#/definitions/Pagination'
                      }
                    }
                  }
                }
              }
            },
            {
              method: 'GET',
              path: '/{id}',
              summary: 'Get user by ID',
              description: 'Retrieve specific user details',
              tags: ['Users'],
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  description: 'User ID'
                }
              ],
              responses: {
                '200': {
                  description: 'User retrieved successfully',
                  schema: {
                    $ref: '#/definitions/User'
                  }
                },
                '404': {
                  description: 'User not found',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            }
          ]
        },
        {
          path: '/products',
          description: 'Product management endpoints',
          operations: [
            {
              method: 'GET',
              path: '/',
              summary: 'Get all products',
              description: 'Retrieve list of products with pagination and filtering',
              tags: ['Products'],
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  type: 'integer',
                  description: 'Page number',
                  default: 1
                },
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of products per page',
                  default: 20
                },
                {
                  name: 'category',
                  in: 'query',
                  type: 'string',
                  description: 'Filter by category ID'
                },
                {
                  name: 'brand',
                  in: 'query',
                  type: 'string',
                  description: 'Filter by brand ID'
                },
                {
                  name: 'search',
                  in: 'query',
                  type: 'string',
                  description: 'Search products by name or description'
                },
                {
                  name: 'minPrice',
                  in: 'query',
                  type: 'number',
                  description: 'Minimum price filter'
                },
                {
                  name: 'maxPrice',
                  in: 'query',
                  type: 'number',
                  description: 'Maximum price filter'
                }
              ],
              responses: {
                '200': {
                  description: 'Products retrieved successfully',
                  schema: {
                    type: 'object',
                    properties: {
                      products: {
                        type: 'array',
                        items: {
                          $ref: '#/definitions/Product'
                        }
                      },
                      pagination: {
                        $ref: '#/definitions/Pagination'
                      }
                    }
                  }
                }
              }
            },
            {
              method: 'GET',
              path: '/{id}',
              summary: 'Get product by ID',
              description: 'Retrieve specific product details',
              tags: ['Products'],
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  description: 'Product ID'
                }
              ],
              responses: {
                '200': {
                  description: 'Product retrieved successfully',
                  schema: {
                    $ref: '#/definitions/Product'
                  }
                },
                '404': {
                  description: 'Product not found',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            },
            {
              method: 'GET',
              path: '/slug/{slug}',
              summary: 'Get product by slug',
              description: 'Retrieve product by slug',
              tags: ['Products'],
              parameters: [
                {
                  name: 'slug',
                  in: 'path',
                  required: true,
                  type: 'string',
                  description: 'Product slug'
                }
              ],
              responses: {
                '200': {
                  description: 'Product retrieved successfully',
                  schema: {
                    $ref: '#/definitions/Product'
                  }
                },
                '404': {
                  description: 'Product not found',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            }
          ]
        },
        {
          path: '/orders',
          description: 'Order management endpoints',
          operations: [
            {
              method: 'GET',
              path: '/',
              summary: 'Get all orders',
              description: 'Retrieve list of orders with pagination and filtering',
              tags: ['Orders'],
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  type: 'integer',
                  description: 'Page number',
                  default: 1
                },
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of orders per page',
                  default: 20
                },
                {
                  name: 'status',
                  in: 'query',
                  type: 'string',
                  description: 'Filter by order status',
                  enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
                }
              ],
              responses: {
                '200': {
                  description: 'Orders retrieved successfully',
                  schema: {
                    type: 'object',
                    properties: {
                      orders: {
                        type: 'array',
                        items: {
                          $ref: '#/definitions/Order'
                        }
                      },
                      pagination: {
                        $ref: '#/definitions/Pagination'
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        {
          path: '/cart',
          description: 'Shopping cart endpoints',
          operations: [
            {
              method: 'GET',
              path: '/{cartId}',
              summary: 'Get cart',
              description: 'Retrieve shopping cart details',
              tags: ['Cart'],
              parameters: [
                {
                  name: 'cartId',
                  in: 'path',
                  required: true,
                  type: 'string',
                  description: 'Cart ID'
                }
              ],
              responses: {
                '200': {
                  description: 'Cart retrieved successfully',
                  schema: {
                    $ref: '#/definitions/Cart'
                  }
                },
                '404': {
                  description: 'Cart not found',
                  schema: {
                    $ref: '#/definitions/Error'
                  }
                }
              }
            }
          ]
        },
        {
          path: '/wishlist',
          description: 'Wishlist endpoints',
          operations: [
            {
              method: 'GET',
              path: '/user/{userId}',
              summary: 'Get user wishlists',
              description: 'Retrieve user wishlists',
              tags: ['Wishlist'],
              parameters: [
                {
                  name: 'userId',
                  in: 'path',
                  required: true,
                  type: 'string',
                  description: 'User ID'
                }
              ],
              responses: {
                '200': {
                  description: 'Wishlists retrieved successfully',
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/Wishlist'
                    }
                  }
                }
              }
            }
          ]
        },
        {
          path: '/reviews',
          description: 'Review endpoints',
          operations: [
            {
              method: 'GET',
              path: '/',
              summary: 'Get all reviews',
              description: 'Retrieve list of reviews with pagination and filtering',
              tags: ['Reviews'],
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  type: 'integer',
                  description: 'Page number',
                  default: 1
                },
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of reviews per page',
                  default: 20
                },
                {
                  name: 'productId',
                  in: 'query',
                  type: 'string',
                  description: 'Filter by product ID'
                },
                {
                  name: 'rating',
                  in: 'query',
                  type: 'integer',
                  description: 'Filter by rating (1-5)',
                  minimum: 1,
                  maximum: 5
                }
              ],
              responses: {
                '200': {
                  description: 'Reviews retrieved successfully',
                  schema: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: {
                          $ref: '#/definitions/Review'
                        }
                      },
                      pagination: {
                        $ref: '#/definitions/Pagination'
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        {
          path: '/coupons',
          description: 'Coupon endpoints',
          operations: [
            {
              method: 'GET',
              path: '/',
              summary: 'Get all coupons',
              description: 'Retrieve list of coupons with pagination and filtering',
              tags: ['Coupons'],
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  type: 'integer',
                  description: 'Page number',
                  default: 1
                },
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of coupons per page',
                  default: 20
                },
                {
                  name: 'isActive',
                  in: 'query',
                  type: 'boolean',
                  description: 'Filter by active status'
                }
              ],
              responses: {
                '200': {
                  description: 'Coupons retrieved successfully',
                  schema: {
                    type: 'object',
                    properties: {
                      coupons: {
                        type: 'array',
                        items: {
                          $ref: '#/definitions/Coupon'
                        }
                      },
                      pagination: {
                        $ref: '#/definitions/Pagination'
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      ],
      definitions: {
        UserRegistration: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              minLength: 6
            },
            firstName: {
              type: 'string',
              minLength: 1
            },
            lastName: {
              type: 'string',
              minLength: 1
            },
            phone: {
              type: 'string'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time'
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER']
            }
          }
        },
        LoginCredentials: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string'
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/definitions/User'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            user: {
              $ref: '#/definitions/User'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            phone: {
              type: 'string'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time'
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER']
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'CUSTOMER']
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED']
            },
            image: {
              type: 'string',
              format: 'uri'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            sku: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            nameEn: {
              type: 'string'
            },
            nameBn: {
              type: 'string'
            },
            slug: {
              type: 'string'
            },
            shortDescription: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            regularPrice: {
              type: 'number',
              format: 'decimal'
            },
            salePrice: {
              type: 'number',
              format: 'decimal'
            },
            costPrice: {
              type: 'number',
              format: 'decimal'
            },
            taxRate: {
              type: 'number',
              format: 'decimal'
            },
            stockQuantity: {
              type: 'integer'
            },
            lowStockThreshold: {
              type: 'integer'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']
            },
            metaTitle: {
              type: 'string'
            },
            metaDescription: {
              type: 'string'
            },
            metaKeywords: {
              type: 'string'
            },
            isFeatured: {
              type: 'boolean'
            },
            isNewArrival: {
              type: 'boolean'
            },
            isBestSeller: {
              type: 'boolean'
            },
            warrantyPeriod: {
              type: 'integer'
            },
            warrantyType: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            publishedAt: {
              type: 'string',
              format: 'date-time'
            },
            category: {
              $ref: '#/definitions/Category'
            },
            brand: {
              $ref: '#/definitions/Brand'
            },
            images: {
              type: 'array',
              items: {
                $ref: '#/definitions/ProductImage'
              }
            },
            specifications: {
              type: 'array',
              items: {
                $ref: '#/definitions/ProductSpecification'
              }
            },
            variants: {
              type: 'array',
              items: {
                $ref: '#/definitions/ProductVariant'
              }
            },
            avgRating: {
              type: 'number'
            }
          }
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            url: {
              type: 'string',
              format: 'uri'
            },
            alt: {
              type: 'string'
            },
            sortOrder: {
              type: 'integer'
            }
          }
        },
        ProductSpecification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            value: {
              type: 'string'
            },
            sortOrder: {
              type: 'integer'
            }
          }
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            sku: {
              type: 'string'
            },
            price: {
              type: 'number',
              format: 'decimal'
            },
            comparePrice: {
              type: 'number',
              format: 'decimal'
            },
            stock: {
              type: 'integer'
            },
            isActive: {
              type: 'boolean'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            slug: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            },
            parentId: {
              type: 'string',
              format: 'uuid'
            },
            bannerImage: {
              type: 'string',
              format: 'uri'
            },
            icon: {
              type: 'string',
              format: 'uri'
            },
            sortOrder: {
              type: 'integer'
            }
          }
        },
        Brand: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            slug: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            website: {
              type: 'string',
              format: 'uri'
            },
            isActive: {
              type: 'boolean'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            orderNumber: {
              type: 'string'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            addressId: {
              type: 'string',
              format: 'uuid'
            },
            subtotal: {
              type: 'number',
              format: 'decimal'
            },
            tax: {
              type: 'number',
              format: 'decimal'
            },
            shippingCost: {
              type: 'number',
              format: 'decimal'
            },
            discount: {
              type: 'number',
              format: 'decimal'
            },
            total: {
              type: 'number',
              format: 'decimal'
            },
            paymentMethod: {
              type: 'string',
              enum: ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET']
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']
            },
            paidAt: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
            },
            notes: {
              type: 'string'
            },
            internalNotes: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            confirmedAt: {
              type: 'string',
              format: 'date-time'
            },
            shippedAt: {
              type: 'string',
              format: 'date-time'
            },
            deliveredAt: {
              type: 'string',
              format: 'date-time'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/definitions/OrderItem'
              }
            },
            transactions: {
              type: 'array',
              items: {
                $ref: '#/definitions/Transaction'
              }
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            productId: {
              type: 'string',
              format: 'uuid'
            },
            variantId: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'integer'
            },
            unitPrice: {
              type: 'number',
              format: 'decimal'
            },
            totalPrice: {
              type: 'number',
              format: 'decimal'
            },
            product: {
              $ref: '#/definitions/Product'
            },
            variant: {
              $ref: '#/definitions/ProductVariant'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            orderId: {
              type: 'string',
              format: 'uuid'
            },
            paymentMethod: {
              type: 'string',
              enum: ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET']
            },
            amount: {
              type: 'number',
              format: 'decimal'
            },
            currency: {
              type: 'string',
              default: 'BDT'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']
            },
            transactionId: {
              type: 'string'
            },
            gatewayResponse: {
              type: 'object'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            sessionId: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/definitions/CartItem'
              }
            },
            subtotal: {
              type: 'number',
              format: 'decimal'
            },
            tax: {
              type: 'number',
              format: 'decimal'
            },
            shippingCost: {
              type: 'number',
              format: 'decimal'
            },
            total: {
              type: 'number',
              format: 'decimal'
            }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            cartId: {
              type: 'string',
              format: 'uuid'
            },
            productId: {
              type: 'string',
              format: 'uuid'
            },
            variantId: {
              type: 'string',
              format: 'uuid'
            },
            quantity: {
              type: 'integer'
            },
            unitPrice: {
              type: 'number',
              format: 'decimal'
            },
            totalPrice: {
              type: 'number',
              format: 'decimal'
            },
            addedAt: {
              type: 'string',
              format: 'date-time'
            },
            product: {
              $ref: '#/definitions/Product'
            },
            variant: {
              $ref: '#/definitions/ProductVariant'
            }
          }
        },
        Wishlist: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            isPrivate: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/definitions/WishlistItem'
              }
            }
          }
        },
        WishlistItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            wishlistId: {
              type: 'string',
              format: 'uuid'
            },
            productId: {
              type: 'string',
              format: 'uuid'
            },
            addedAt: {
              type: 'string',
              format: 'date-time'
            },
            product: {
              $ref: '#/definitions/Product'
            }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            productId: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5
            },
            title: {
              type: 'string'
            },
            comment: {
              type: 'string'
            },
            isVerified: {
              type: 'boolean'
            },
            isApproved: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            user: {
              $ref: '#/definitions/User'
            },
            product: {
              $ref: '#/definitions/Product'
            }
          }
        },
        Coupon: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            code: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['PERCENTAGE', 'FIXED_AMOUNT']
            },
            value: {
              type: 'number',
              format: 'decimal'
            },
            minAmount: {
              type: 'number',
              format: 'decimal'
            },
            maxDiscount: {
              type: 'number',
              format: 'decimal'
            },
            usageLimit: {
              type: 'integer'
            },
            usedCount: {
              type: 'integer'
            },
            isActive: {
              type: 'boolean'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer'
            },
            limit: {
              type: 'integer'
            },
            total: {
              type: 'integer'
            },
            pages: {
              type: 'integer'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  generateSwaggerDocs() {
    const options = {
      definition: this.generateSwaggerSpec(),
      apisDir: './docs',
      host: this.config.get('NODE_ENV') === 'production' 
        ? 'api.smarttechnologies.bd' 
        : 'localhost:3001',
      schemes: ['https'],
      swaggerGenerator: {
        app: './app.js',
        swaggerFile: './swagger.json',
        produces: ['application/json'],
        consumes: ['application/json'],
        securityDefinitions: {
          BearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    };

    return swaggerJsdoc(options);
  }
}

// Singleton instance
const swaggerService = new SwaggerService();

module.exports = {
  SwaggerService,
  swaggerService
};