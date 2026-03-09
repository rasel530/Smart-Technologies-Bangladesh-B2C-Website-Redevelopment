const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/orders/admin/modifications?page=1&limit=10',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYTU5YmY0Ny00YjY2LTQzMWQtYmE2My1hMGE2OTQzNzc5OGYiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHNtYXJ0dGVjaC5jb20iLCJpYXQiOjE3NDM4MzA2NDgsImV4cCI6MTc0NDkxODY0OH0.5X7KqQhM8TjY3ZqJ5D8vF2ZxPqLhYwNkXQ3pA4'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response: ${data}`);
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.end();
