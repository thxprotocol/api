module.exports = {
    apps: [
        {
            name: 'api',
            script: 'dist/src/server.js',
            instances: 'max',
            max_memory_restart: '250M',
            env_development: {
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
