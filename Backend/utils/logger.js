const winston = require('winston');

// Determine log format based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Custom structured format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  isProduction
    ? winston.format.json() // Production: structured JSON for log aggregators (Loki, CloudWatch, ELK)
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, requestId, duration, stack, ...meta }) => {
          const reqInfo = requestId ? ` [reqId: ${requestId}]` : '';
          const durInfo = duration ? ` (${duration}ms)` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]${reqInfo}: ${message}${durInfo}${metaStr}${stack ? `\n${stack}` : ''}`;
        })
      )
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: 'devcollab-backend' },
  format: customFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
