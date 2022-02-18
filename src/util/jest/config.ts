import db from '@/util/database';
import { mockStart } from './mock';
import { agenda } from '@/util/agenda';
import { mockClear } from './mock';
import { logger } from '@/util/logger';
import { getProvider, NetworkProvider } from '@/util/network';
import { POOL_REGISTRY_ADDRESS } from '@/util/secrets';
import { poll } from './polling';

export async function beforeAllCallback() {
    await db.truncate();
    mockStart();

    const { web3 } = getProvider(NetworkProvider.Main);
    const fn = () => web3.eth.getCode(POOL_REGISTRY_ADDRESS);
    const fnCondition = (result: string) => result === '0x';

    await poll(fn, fnCondition, 500);
}

export async function afterAllCallback() {
    await agenda.stop();
    await agenda.purge(); // TODO Does not trunacte dangling jobs collection
    await agenda.close();
    logger.info('Closed agenda');
    await db.disconnect();
    logger.info('Truncated and disconnected mongo');
    mockClear();
    logger.info('Cleared mocks');
}
