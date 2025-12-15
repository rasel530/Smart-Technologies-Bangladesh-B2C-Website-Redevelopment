"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create({
        logger: ['log', 'error', 'warn', 'debug'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const port = process.env.PORT || 3001;
    await app.listen(port, () => {
        console.log(`🚀 Application is running on port ${port}`);
        console.log(`📍 Health check: http://localhost:${port}/health`);
        console.log(`📍 API docs: http://localhost:${port}/api`);
    });
}
bootstrap().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=test-server.js.map