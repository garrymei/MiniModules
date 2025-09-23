const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Simple in-memory data store for demo
const tenants = [
  { id: 1, name: 'Restaurant A', type: 'restaurant', status: 'active' },
  { id: 2, name: 'Booking Service B', type: 'booking', status: 'active' },
];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    sendJSON(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MiniModules API',
      version: '0.1.0'
    });
    return;
  }

  // Tenant endpoints
  if (pathname === '/api/tenant' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      tenants: tenants,
      count: tenants.length
    });
    return;
  }

  if (pathname.startsWith('/api/tenant/') && method === 'GET') {
    const tenantId = parseInt(pathname.split('/')[3]);
    const tenant = tenants.find(t => t.id === tenantId);
    
    if (tenant) {
      sendJSON(res, 200, {
        success: true,
        tenant: tenant
      });
    } else {
      sendJSON(res, 404, {
        success: false,
        message: 'Tenant not found'
      });
    }
    return;
  }

  // Default 404 handler
  sendJSON(res, 404, {
    success: false,
    message: 'Route not found',
    availableEndpoints: [
      'GET /health - Health check',
      'GET /api/tenant - List all tenants',
      'GET /api/tenant/:id - Get specific tenant'
    ]
  });
});

server.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Tenants API: http://localhost:${PORT}/api/tenant`);
});