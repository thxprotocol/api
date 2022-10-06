import db from '@/util/database';
import { mockStart, mockClear } from './mock';
import { agenda } from '@/util/agenda';
import { logger } from '@/util/logger';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import { getContract, getContractConfig } from '@/config/contracts';
import { poll } from '../polling';
import { currentVersion } from '@thxnetwork/artifacts';

export async function beforeAllCallback() {
    await db.truncate();
    mockStart();

    const { web3, defaultAccount } = getProvider(ChainId.Hardhat);
    const fn = () => web3.eth.getCode(getContractConfig(ChainId.Hardhat, 'OwnershipFacet').address);
    const fnCondition = (result: string) => result === '0x';

    await poll(fn, fnCondition, 500);

    const registryAddress = getContractConfig(ChainId.Hardhat, 'Registry', currentVersion).address;
    const factory = getContract(ChainId.Hardhat, 'Factory');

    // TODO Make this part of hardhat container build
    await factory.methods.initialize(defaultAccount, registryAddress).send({ from: defaultAccount });
}

export async function afterAllCallback() {
    await agenda.stop();
    await agenda.purge();
    await agenda.close();
    logger.info(`Closed agenda ${agenda.name}`);

    await db.disconnect();
    logger.info('Truncated and disconnected mongo');

    mockClear();
    logger.info('Cleared mocks');
}
