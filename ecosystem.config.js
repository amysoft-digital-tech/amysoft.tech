module.exports = {
  apps: [
    {
      name: 'amysoft-api',
      script: 'dist/apps/api/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/amysoft/api-error.log',
      out_file: '/var/log/amysoft/api-out.log',
      log_file: '/var/log/amysoft/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'production-server.amysoft.tech',
      ref: 'origin/main',
      repo: 'git@github.com:amysoft-digital-tech/amysoft.tech.git',
      path: '/var/www/amysoft',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};