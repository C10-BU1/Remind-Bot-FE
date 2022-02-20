module.exports = {
  apps: [],

  deploy: {
    production: {
      user: 'deploy',
      host: '54.65.94.81',
      ref: 'origin/main',
      repo: ' git@github.com:C10-BU1/Remind-Bot-FE.git',
      path: '/home/deploy/frontend-production',
      'post-deploy':
        'cd /home/deploy/frontend-production/current && yarn install --production=false && yarn build',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
