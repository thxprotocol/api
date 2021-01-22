module.exports = {
    apps: [
        {
            name: 'api',
            script: 'dist/src/server.js',
            instances: 'max',
            env_staging: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            error_file: 'logs/error.log',
            out_file: 'logs/combined.log',
            log_date_format: 'YYYY-MM-DD HH:mm Z',
        },
    ],
};
