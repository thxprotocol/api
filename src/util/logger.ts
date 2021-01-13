import winston from "winston";

const options: winston.LoggerOptions = {
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
    ],
};

const logger = winston.createLogger(options);

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
    logger.debug("Logging initialized at debug level");
}

export default logger;
