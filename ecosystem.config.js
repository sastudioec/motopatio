module.exports = {
  apps: [
    {
      name: 'motopatio',
      cwd: '/var/www/motopatio',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '800M',
      max_restarts: 10,
      min_uptime: '30s',
      kill_timeout: 10000,
      error_file: '/root/.pm2/logs/motopatio-error.log',
      out_file: '/root/.pm2/logs/motopatio-out.log',
      merge_logs: true,
    },
  ],
};
