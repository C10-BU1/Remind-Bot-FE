module.exports = {
  apps : [{
    name: 'serve-data-prod',
    script: './dist/main.js',
    cwd: __dirname,
    instances: 2, // default 1
    autorestart: true,
    exec_mode: 'cluster', // allow scale up app
    env: {
        NODE_ENV: 'production',
    },
  }],

  deploy : {
    production : {
      user : 'deploy',
      host : '54.65.94.81',
      ref  : 'origin/main',
      repo : ' git@github.com-be:C10-BU1/Remind-Bot-BE.git',
      path : '/home/deploy/production',
      'post-deploy' : 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    }
  }
};