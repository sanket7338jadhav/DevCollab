// ==========================================
// PM2 Process Manager Configuration
// Optional alternative to Docker
// Usage: pm2 start ecosystem.config.js
// ==========================================

module.exports = {
  apps: [
    {
      name: 'devcollab-backend',
      script: './Backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
