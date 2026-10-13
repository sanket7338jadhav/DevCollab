const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  // Use existing header or generate unique correlation ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Skip noisy metric and health poll logging
  if (req.path === '/metrics' || req.path === '/api/health') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log({
      level: logLevel,
      message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
    });
  });

  next();
}

module.exports = requestLogger;
