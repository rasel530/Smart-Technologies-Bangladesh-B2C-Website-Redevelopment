const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Smart Technologies Bangladesh B2C Backend Server is Running!',
        port: port,
        timestamp: new Date().toISOString(),
        status: 'healthy'
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.listen(port, () => {
    console.log(`🚀 Server started successfully on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
});
//# sourceMappingURL=minimal-server.js.map