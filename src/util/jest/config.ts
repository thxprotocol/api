import db from '@/util/database';
import { mockStart } from './mock';
import { agenda, agendaAsync } from '@/util/agenda';
import { mockClear } from './mock';
import { logger } from '@/util/logger';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import { getContractConfig } from '@/config/contracts';
import { poll } from '../polling';

export async function beforeAllCallback() {
    await db.truncate();
    mockStart();

    const { web3 } = getProvider(ChainId.Hardhat);
    const fn = () => web3.eth.getCode(getContractConfig(ChainId.Hardhat, 'OwnershipFacet').address);
    const fnCondition = (result: string) => result === '0x';

    await poll(fn, fnCondition, 500);
}

export async function afterAllCallback() {
    for (const a of [agenda, agendaAsync]) {
        await a.stop();
        await a.purge(); // TODO Does not trunacte dangling jobs collection
        await a.close();
        logger.info(`Closed agenda ${a.name}`);
    }

    await db.disconnect();
    logger.info('Truncated and disconnected mongo');

    mockClear();
    logger.info('Cleared mocks');
}
