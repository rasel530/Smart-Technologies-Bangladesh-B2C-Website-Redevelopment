import type { PrismaClient } from '@prisma/client';

const config: PrismaClient = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev',
    },
  },
};

export default config;