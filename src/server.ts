import http from 'http';
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import app from './app';
import db from './util/database';
import { logger } from './util/logger';

const server = http.createServer(app);

const healthcheck: HealthCheck = async () => {
    const status = { dbConnected: db.readyState() === 1 };

    const method = Object.values(status).filter((i) => !i).length === 0 ? Promise.resolve : Promise.reject;
    return method(status);
};

function onSignal(): Promise<any> {
    logger.info('Server is starting cleanup');
    return Promise.all([db.disconnect()]);
}

const options = {
    healthChecks: {
        '/healthcheck': healthcheck,
        'verbatim': true,
    },
    onSignal,
};

createTerminus(server, options);

server.listen(app.get('port'));

export default server;
