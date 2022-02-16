import db from '../database';
import server from '../../server';
import { mockStart } from './mock';
import { agenda } from '../agenda';
import { mockClear } from './mock';
import { logger } from '../logger';

export async function beforeAllCallback() {
    await db.truncate();
    mockStart();
}

export async function afterAllCallback() {
    await agenda.stop();
    await agenda.purge(); // TODO Does not trunacte dangling jobs collection
    await agenda.close();
    logger.info('Closed agenda');
    await db.disconnect();
    logger.info('Truncated and disconnected mongo');
    server.close();
    logger.info('Closed server');
    mockClear();
    logger.info('Cleared mocks');
}
