module.exports = {
    apps: [
        {
            name: "api",
            script: "dist/src/server.js",
            env: {
                NODE_ENV: "development",
            },
            error_file: "logs/error.log",
            out_file: "logs/combined.log",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
};
