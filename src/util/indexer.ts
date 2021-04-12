import { logger } from './logger';
import { NetworkProvider, SolutionArtifact, solutionContract } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { BigNumber, providers, utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { formatEther } from 'ethers/lib/utils';
import { TESTNET_RPC_WSS, RPC_WSS } from './secrets';

const events = [
    {
        topics: [utils.id('WithdrawPollCreated(uint256,uint256)')],
        callback: 'onWithdrawPollCreated',
    },
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
                logger.error('EventIndexer start() failed.');
            }
        } catch (e) {
            logger.error('EventIndexer AssetPool.find() failed.');
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
            logger.info('EventIndexer stop() failed.');
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
                    (log: any) => {
                        try {
                            const ev = parseLog(SolutionArtifact.abi, log);
                            const args = parseArgs(ev);

                            logger.info(
                                `Block #${log.blockNumber} - ${ev.name} - ${JSON.stringify(args)} Hash=${
                                    log.transactionHash
                                }`,
                            );

                            (this as any)[event.callback](npid, address, args);
                        } catch (e) {
                            logger.error('EventIndexer event.callback() failed.');
                        }
                    },
                );
            }
        } catch (e) {
            logger.error('EventIndexer addListener() failed.');
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
            logger.error('EventIndexer removeListener() failed.');
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
            logger.error('EventIndexer.onWithdrawPollVoted() failed.');
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
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.');
        }
    }

    async onWithdrawPollCreated(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const existingWithdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            if (existingWithdrawal) {
                return;
            }

            const solution = solutionContract(npid, address);
            const amount = Number(formatEther(await solution.getAmount(id)));
            const withdrawal = new Withdrawal({
                id,
                amount,
                poolAddress: solution.address,
                beneficiary: await solution.getAddressByMember(args.member),
                approved: await solution.withdrawPollApprovalState(id),
                state: WithdrawalState.Pending,
                poll: {
                    startTime: (await solution.getStartTime(id)).toNumber(),
                    endTime: (await solution.getEndTime(id)).toNumber(),
                    yesCounter: 0,
                    noCounter: 0,
                    totalVoted: 0,
                },
            });

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollCreated() failed.');
        }
    }

    async onWithdrawn(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.');
        }
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll = {};

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollFinalized() failed.');
        }
    }
}

export const eventIndexer = new EventIndexer();
