const client = require('prom-client');

// Create a custom Prometheus Registry
const register = new client.Registry();

// Add default system/process metrics (CPU, Memory, Event Loop Lag, GC, File Descriptors)
client.collectDefaultMetrics({
  register,
  prefix: 'devcollab_',
  labels: { app: 'devcollab-backend' },
});

// ==============================================================================
// SRE FOUR GOLDEN SIGNALS & CUSTOM APPLICATION METRICS
// ==============================================================================

// 1. TRAFFIC & ERRORS: Total HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: 'devcollab_http_requests_total',
  help: 'Total number of HTTP requests processed by DevCollab Backend',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 2. LATENCY: HTTP Request Duration Histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'devcollab_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds (Latency distribution)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// 3. SATURATION: In-flight HTTP Requests Gauge
const httpRequestsInFlight = new client.Gauge({
  name: 'devcollab_http_requests_in_flight',
  help: 'Current number of active in-flight HTTP requests',
  registers: [register],
});

// 4. SATURATION: Active WebSocket Connections Gauge
const socketActiveConnections = new client.Gauge({
  name: 'devcollab_socket_active_connections',
  help: 'Current number of active Socket.io connected users',
  registers: [register],
});

// Real-time Chat message throughput counter
const socketMessagesTotal = new client.Counter({
  name: 'devcollab_socket_messages_sent_total',
  help: 'Total number of real-time messages transmitted via Socket.io',
  registers: [register],
});

// Database connectivity status gauge (1 = Connected, 0 = Disconnected)
const dbConnectedGauge = new client.Gauge({
  name: 'devcollab_database_connected',
  help: 'MongoDB connection state (1 for connected, 0 for disconnected)',
  registers: [register],
});

// Helper: Normalize route paths so dynamic IDs don't cause high label cardinality
function normalizeRoute(path) {
  if (!path) return 'unknown';
  // Strip query strings
  const cleanPath = path.split('?')[0];
  // Replace MongoDB ObjectIDs / UUIDs / 24-char hex strings with :id
  return cleanPath
    .replace(/\/[a-fA-F0-9]{24}(\/|$)/g, '/:id$1')
    .replace(/\/[0-9]+(\/|$)/g, '/:id$1')
    .replace(/\/+$/, '') || '/';
}

// Middleware to measure HTTP request latency, traffic, and error rates
function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path === '/api/health') {
    return next();
  }

  httpRequestsInFlight.inc();
  const start = process.hrtime();

  res.on('finish', () => {
    httpRequestsInFlight.dec();

    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = normalizeRoute(req.baseUrl ? `${req.baseUrl}${req.path}` : req.path);
    const statusCode = res.statusCode ? res.statusCode.toString() : 'unknown';

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    httpRequestsTotal,
    httpRequestDurationSeconds,
    httpRequestsInFlight,
    socketActiveConnections,
    socketMessagesTotal,
    dbConnectedGauge,
  },
};
