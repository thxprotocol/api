import morgan from 'morgan';
import winston from 'winston';
import { NODE_ENV } from '@/config/secrets';

const formatWinston = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

export const logger = winston.createLogger({
    level: NODE_ENV === 'test' ? 'warn' : 'http',
    format: formatWinston,
    transports: [new winston.transports.Console()],
});

export const requestLogger = morgan('tiny', {
    stream: { write: (message: string) => logger.http(JSON.parse(message)) },
});
