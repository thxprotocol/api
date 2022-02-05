import http from 'http';
import app from './app';
import db from './util/database';
import { createTerminus } from '@godaddy/terminus';
import { healthCheck } from './util/healthcheck';
import { logger } from './util/logger';
import { agenda } from './util/agenda';
import { ENVIRONMENT } from './util/secrets';

const server = http.createServer(app);

// Called on server close
function onSignal(): Promise<any> {
    logger.info('Server is starting cleanup');
    return Promise.all([db.disconnect(), agenda.stop()]);
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

logger.info(`Server is starting on port: ${app.get('port')}, env: ${ENVIRONMENT}`);
server.listen(app.get('port'));

export default server;
