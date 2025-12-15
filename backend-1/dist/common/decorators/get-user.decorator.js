"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserFromContext = exports.GetUser = exports.USER_KEY = void 0;
exports.USER_KEY = 'user';
const GetUser = () => (target, propertyKey, parameterIndex) => {
    return function (target, propertyKey, parameterIndex) {
        Reflect.defineMetadata(exports.USER_KEY, {
            propertyKey,
            parameterIndex
        }, target);
    };
};
exports.GetUser = GetUser;
const GetUserFromContext = (ctx) => {
    const request = ctx.switchToHttp();
    return request.user;
};
exports.GetUserFromContext = GetUserFromContext;
//# sourceMappingURL=get-user.decorator.js.map