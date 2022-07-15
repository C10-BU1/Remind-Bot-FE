module.exports = {
    apps: [{
        name: 'BE',
        script: './dist/main.js',
        cwd: __dirname,
        instances: 1, // default 1
        autorestart: true,
        exec_mode: 'cluster', // allow scale up app
        env: {
            NODE_ENV: 'production',
        },
    }],

    deploy: {
        production: {
            user: 'deploy',
            host: '54.65.94.81',
            ref: 'origin/main',
            repo: ' git@github.com-be:C10-BU1/Remind-Bot-BE.git',
            path: '/home/deploy/production',
            'post-deploy': 'cd /home/deploy/production/current && yarn install && yarn build && pm2 startOrReload ecosystem.config.js',
            env: {
                NODE_ENV: 'production',
            },
        }
    }
};