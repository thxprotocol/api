import morgan from 'morgan';
import json from 'morgan-json';
import winston from 'winston';
import { Request } from 'express';
import { ENVIRONMENT, VERSION } from './secrets';

const formatWinston = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.json(),
);

const instance = winston.createLogger({
    level: 'info',
    format: formatWinston,
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (ENVIRONMENT !== 'production' && ENVIRONMENT !== 'development') {
    instance.add(new winston.transports.Console());
    instance.debug('Logging initialized at debug level');
}

morgan.token('timestamp', function getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substr(0, 19);
});

const formatMorgan = json({
    'method': ':method',
    'url': ':url',
    'status': ':status',
    'timestamp': ':timestamp',
    'ip': ':remote-addr',
    'bytes': ':res[content-length]',
    'ms': ':response-time',
    'user': 'remote-user',
    'user-agent': ':user-agent',
});

export const logger = instance;
export const requestLogger = morgan(formatMorgan, {
    skip: (req: Request) => req.baseUrl && req.baseUrl.startsWith(`/${VERSION}/ping`),
});
