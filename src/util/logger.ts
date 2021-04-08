import morgan from 'morgan';
import winston from 'winston';
import { Request } from 'express';
import { ENVIRONMENT, VERSION } from './secrets';

const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);

const instance = winston.createLogger({
    level: 'info',
    format,
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (ENVIRONMENT !== 'production' && ENVIRONMENT !== 'development') {
    instance.add(new winston.transports.Console());
    instance.debug('Logging initialized at debug level');
}

export const logger = instance;
export const requestLogger = morgan(
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    {
        skip: (req: Request) => (req.baseUrl && req.baseUrl.startsWith(`/${VERSION}/ping`)) || ENVIRONMENT === '2test',
        stream: {
            write: (message: string) => instance.info(message.substring(0, message.lastIndexOf('\n'))),
        },
    },
);
