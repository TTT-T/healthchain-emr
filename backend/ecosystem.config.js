module.exports = {
  apps: [
    {
      name: 'healthchain-backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      
      // Environment specific settings
      node_args: '--max-old-space-size=1024',
      
      // Process management
      autorestart: true,
      restart_delay: 4000,
      
      // Error handling
      exp_backoff_restart_delay: 100,
      
      // Monitoring
      pmx: true,
      
      // Source map support
      source_map_support: true,
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Merge logs
      merge_logs: true,
      
      // Time format
      time: true
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/healthchain-emr.git',
      path: '/var/www/healthchain-emr',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
