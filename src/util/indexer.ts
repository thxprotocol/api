import { logger } from './logger';
import { provider, SolutionArtifact } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { ContractEvent } from '../models/ContractEvent';

const eventListeners = [
    [utils.id('WithdrawPollCreated(uint256,uint256)')],
    [utils.id('Withdrawn(uint256,address,uint256)')],
];

export default class EventIndexer {
    assetPools: string[];

    async start() {
        try {
            const allAssetPools = await AssetPool.find({});

            this.assetPools = allAssetPools
                .map((item: AssetPoolDocument) => item.address)
                .filter((item: AssetPoolDocument, i: number, list: AssetPoolDocument[]) => list.indexOf(item) === i);

            try {
                for (const address of this.assetPools) {
                    for (const topics of eventListeners) {
                        provider.on(
                            {
                                address,
                                topics,
                            },
                            this.save,
                        );
                    }
                }
                logger.info('EventIndexer started.');
            } catch (e) {
                logger.error('EventIndexer start() failed.');
            }
        } catch (e) {
            logger.error('EventIndexer AssetPool.find() failed.');
        }
    }

    async stop() {
        try {
            for (const address of this.assetPools) {
                for (const topics of eventListeners) {
                    provider.off({
                        address,
                        topics,
                    });
                }
            }
        } catch (e) {
            logger.info('EventIndexer stop() failed.');
        }
    }

    ketchup() {
        debugger;
    }

    add(address: string) {
        try {
            for (const topics of eventListeners) {
                provider.on(
                    {
                        address,
                        topics,
                    },
                    this.save,
                );
            }
        } catch (e) {
            logger.error('EventIndexer add() failed.');
        }
    }

    async save(log: any) {
        try {
            const ev = parseLog(SolutionArtifact.abi, log);
            const args = parseArgs(ev);

            try {
                const event = new ContractEvent({
                    transactionHash: log.transactionHash,
                    contractAddress: log.address,
                    name: ev.name,
                    args,
                    blockNumber: log.blockNumber,
                });

                await event.save();

                logger.info(
                    `Block #${log.blockNumber} - ${event.name} [ ${JSON.stringify(event.args)} ] - Hash: ${
                        event.transactionHash
                    } - Contract: ${event.contractAddress}`,
                );
            } catch (e) {
                logger.error('EventIndexer save() failed.');
            }
        } catch (e) {
            logger.error('EventIndexer parseLog() failed.');
        }
    }
}
