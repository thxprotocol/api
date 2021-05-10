import { logger } from './logger';
import { NetworkProvider, SolutionArtifact, solutionContract } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { BigNumber, providers, utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { TESTNET_RPC_WSS, RPC_WSS } from './secrets';

const events = [
    {
        topics: [utils.id('WithdrawPollFinalized(uint256,bool')],
        callback: 'onWithdrawPollFinalized',
    },
    {
        topics: [utils.id('Withdrawn(uint256,address,uint256)')],
        callback: 'onWithdrawn',
    },
    {
        topics: [utils.id('WithdrawPollVoted(uint256,address,bool)')],
        callback: 'onWithdrawPollVoted',
    },
    {
        topics: [utils.id('WithdrawPollRevokedVote(uint256,address)')],
        callback: 'onWithdrawPollRevokedVote',
    },
];

class EventIndexer {
    assetPools: AssetPoolDocument[] = [];
    providers = [new providers.WebSocketProvider(TESTNET_RPC_WSS), new providers.WebSocketProvider(RPC_WSS)];

    async start() {
        try {
            this.assetPools = await AssetPool.find({});

            try {
                for (const assetPool of this.assetPools) {
                    this.addListener(assetPool.network, assetPool.address);
                }
                logger.info('EventIndexer started.');
            } catch (e) {
                logger.error('EventIndexer start() failed.', e);
            }
        } catch (e) {
            logger.error('EventIndexer AssetPool.find() failed.', e);
        }
    }

    async stop(npid: NetworkProvider) {
        try {
            for (const assetPool of this.assetPools) {
                for (const event of events) {
                    this.providers[npid].off({
                        address: assetPool.address,
                        topics: event.topics,
                    });
                }
            }
        } catch (e) {
            logger.info('EventIndexer stop() failed.', e);
        }
    }

    addListener(npid: NetworkProvider, address: string) {
        try {
            for (const event of events) {
                this.providers[npid].on(
                    {
                        address,
                        topics: event.topics,
                    },
                    async (log: any) => {
                        try {
                            const ev = parseLog(SolutionArtifact.abi, log);
                            const args = parseArgs(ev);

                            logger.info(
                                `Block #${log.blockNumber} - ${ev.name} - ${JSON.stringify(args)} Hash=${
                                    log.transactionHash
                                }`,
                            );

                            await (this as any)[event.callback](npid, address, args);
                        } catch (e) {
                            logger.error('EventIndexer event.callback() failed.', e);
                        }
                    },
                );
            }
        } catch (e) {
            logger.error('EventIndexer addListener() failed.', e);
        }
    }

    removeListener(npid: NetworkProvider, address: string) {
        if (!address) return;

        try {
            for (const event of events) {
                this.providers[npid].off({
                    address,
                    topics: event.topics,
                });
            }
        } catch (e) {
            logger.error('EventIndexer removeListener() failed.', e);
        }
    }

    async onWithdrawPollVoted(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const solution = solutionContract(npid, address);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            if (args.vote === true) {
                withdrawal.poll.yesCounter += 1;
            } else if (args.vote === false) {
                withdrawal.poll.noCounter += 1;
            }

            withdrawal.approved = await solution.withdrawPollApprovalState(id);
            withdrawal.poll.totalVoted += 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollVoted() failed.', e);
        }
    }

    async onWithdrawPollRevokedVote(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });
            const solution = solutionContract(npid, address);
            const vote = solution.votesByAddress(args.member);

            if (vote === true) {
                withdrawal.poll.yesCounter -= 1;
            } else if (vote === false) {
                withdrawal.poll.noCounter -= 1;
            }

            withdrawal.approved = await solution.withdrawPollApprovalState(id);
            withdrawal.poll.totalVoted -= 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.', e);
        }
    }

    async onWithdrawn(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.', e);
        }
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll = {};

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollFinalized() failed.', e);
        }
    }
}

export const eventIndexer = new EventIndexer();
