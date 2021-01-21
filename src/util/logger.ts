import morgan from 'morgan';
import winston from 'winston';
import { ENVIRONMENT } from './secrets';

const error = new winston.transports.File({ filename: 'logs/error.log', level: 'error' });
const combined = new winston.transports.File({ filename: 'logs/combined.log' });
const options: winston.LoggerOptions = {
    level: 'info',
    format: winston.format.json(),
    transports: [error, combined],
};

export const logger = winston.createLogger(options);

export const requestLogger = morgan('combined', {
    skip: () => ENVIRONMENT === 'test',
    stream: { write: (message: any) => logger.info(message) },
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
    logger.debug('Logging initialized at debug level');
}

export default logger;
