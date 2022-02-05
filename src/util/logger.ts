import morgan from 'morgan';
import json from 'morgan-json';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { Request } from 'express';
import { ENVIRONMENT, VERSION } from './secrets';

const formatWinston = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.json(),
);

export const logger = winston.createLogger({
    level: 'http',
    format: formatWinston,
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/error/%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '30d',
            level: 'error',
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined/%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '30d',
        }),
    ],
});

if (ENVIRONMENT !== 'production') {
    logger.add(new winston.transports.Console());
}

const formatMorgan = json({
    'method': ':method',
    'url': ':url',
    'status': ':status',
    'ip': ':remote-addr',
    'bytes': ':res[content-length]',
    'ms': ':response-time',
    'user': ':remote-user',
    'user-agent': ':user-agent',
});

export const requestLogger = morgan(formatMorgan, {
    skip: (req: Request) => req.baseUrl && req.baseUrl.startsWith(`/${VERSION}/ping`),
    stream: { write: (message: string) => logger.http(JSON.parse(message)) },
});
