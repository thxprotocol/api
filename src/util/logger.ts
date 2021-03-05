import { Request } from 'express';
import morgan from 'morgan';
import winston from 'winston';
import { ENVIRONMENT, VERSION } from './secrets';

const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);
const error = new winston.transports.File({ filename: 'logs/error.log', level: 'error' });
const combined = new winston.transports.File({ filename: 'logs/combined.log' });
const options: winston.LoggerOptions = {
    level: 'info',
    format,
    transports: [new winston.transports.Console(), error, combined],
};

export const logger = winston.createLogger(options);

export const requestLogger = morgan(
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    {
        skip: (req: Request) => ENVIRONMENT === 'test' || req.baseUrl.startsWith(`/${VERSION}/ping`),
        stream: {
            write: (message: string) => {
                logger.info(message.substring(0, message.lastIndexOf('\n')));
            },
        },
    },
);
