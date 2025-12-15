"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
async function bootstrap() {
    const app = await core_1.NestFactory.create({
        logger: ['log', 'error', 'warn', 'debug'],
    });
    const port = process.env.PORT || 3001;
    await app.listen(port, () => {
        console.log(`🚀 Smart Technologies Backend Server is running on port ${port}`);
        console.log(`📍 Health check: http://localhost:${port}/health`);
        console.log(`📍 API docs: http://localhost:${port}/api`);
    });
}
bootstrap().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=standalone-server.js.map