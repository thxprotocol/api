import http from 'http';
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import app from './app';
import db from './util/database';
import { logger } from './util/logger';

const server = http.createServer(app);

const healthcheck: HealthCheck = async () => {
    const status = [{ info: { dbConnected: db.isConnected() } }];
    return Promise.resolve(status);
};

function onSignal(): Promise<any> {
    logger.info('Server is starting cleanup');
    return Promise.all([db.disconnect()]);
}

const options = {
    healthChecks: {
        '/healthcheck': healthcheck,
    },
    onSignal,
};

createTerminus(server, options);

server.listen(app.get('port'));

export default server;
