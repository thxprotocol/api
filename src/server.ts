import http from 'http';
import { createTerminus } from '@godaddy/terminus';
import app from './app';
import db from './util/database';
import { healthCheck } from './util/healthcheck';
import { logger } from './util/logger';

const server = http.createServer(app);

function onSignal(): Promise<any> {
    logger.info('Server is starting cleanup');
    return Promise.all([db.disconnect()]);
}

const options = {
    healthChecks: {
        '/healthcheck': healthCheck,
        'verbatim': true,
    },
    onSignal,
    logger: logger.error,
};

createTerminus(server, options);

server.listen(app.get('port'));

export default server;
