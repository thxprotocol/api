module.exports = {
    apps: [
        {
            name: 'api',
            script: '$HOME/api/dist/src/server.js',
            interpreter: 'none',
            env: {
                NODE_ENV: 'development',
            },
            error_file: '$HOME/api/logs/error.log',
            out_file: '$HOME/api/logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm Z',
        },
    ],
};
