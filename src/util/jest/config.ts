import db from '../database';
import server from '../../server';
import { mockStart } from './mock';
import { agenda } from '../agenda';
import { mockClear } from './mock';
import { logger } from '../logger';
import { getProvider, NetworkProvider } from '../network';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '../secrets';
import { poll } from './polling';

export async function beforeAllCallback() {
    await db.truncate();
    mockStart();

    const { web3 } = getProvider(NetworkProvider.Main);
    const checks = [web3.eth.getCode(TESTNET_POOL_REGISTRY_ADDRESS), web3.eth.getCode(POOL_REGISTRY_ADDRESS)];
    const fn = () => Promise.all(checks);
    const fnCondition = (result: string[]) => result.includes('0x');

    await poll(fn, fnCondition, 500);
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
