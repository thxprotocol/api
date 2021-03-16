import { logger } from './logger';
import { provider, SolutionArtifact } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { ContractEvent } from '../models/ContractEvent';

const events = [[utils.id('WithdrawPollCreated(uint256,uint256)')], [utils.id('Withdrawn(uint256,address,uint256)')]];

class EventIndexer {
    assetPools: string[] = ['0x2033a07563Ea7c404b1f408CFE6d5d65F08F4b48'];

    async start() {
        try {
            const allAssetPools = await AssetPool.find({});

            this.assetPools = allAssetPools
                .map((item: AssetPoolDocument) => item.address)
                .filter((item: AssetPoolDocument, i: number, list: AssetPoolDocument[]) => list.indexOf(item) === i);

            try {
                for (const address of this.assetPools) {
                    this.add(address);
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
                for (const topics of events) {
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
        if (!address) return;

        try {
            for (const topics of events) {
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
                    `Block #${log.blockNumber} - ${event.name} - ${JSON.stringify(event.args)} Hash=${
                        event.transactionHash
                    }`,
                );
            } catch (e) {
                logger.error('EventIndexer save() failed.');
            }
        } catch (e) {
            logger.error('EventIndexer parseLog() failed.');
        }
    }
}

export const indexer = new EventIndexer();
