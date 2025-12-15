import { ExecutionContext } from '@nestjs/common';

export const USER_KEY = 'user';

// Simple parameter decorator that extracts user from request
export const GetUser = (): any => (target: any, propertyKey: string | symbol, parameterIndex: number) => {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    // Store metadata for parameter extraction
    Reflect.defineMetadata(USER_KEY, {
      propertyKey,
      parameterIndex
    }, target);
  };
};

// Helper function to extract user from execution context
export const GetUserFromContext = (ctx: ExecutionContext) => {
  const request = ctx.switchToHttp();
  return (request as any).user;
};