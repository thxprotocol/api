import { logger } from './logger';
import { callFunction, NetworkProvider, SolutionArtifact, solutionContract } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { formatEther } from 'ethers/lib/utils';
import { RPC_WSS, TESTNET_RPC_WSS } from './secrets';
import Web3 from 'web3';
import { Subscription } from 'web3-core-subscriptions';
import { Log } from 'web3-core';

const topics = [
    utils.id('WithdrawPollCreated(uint256,uint256)'),
    utils.id('WithdrawPollFinalized(uint256,bool'),
    utils.id('Withdrawn(uint256,address,uint256)'),
    utils.id('WithdrawPollVoted(uint256,address,bool)'),
    utils.id('WithdrawPollRevokedVote(uint256,address)'),
];

class EventIndexer {
    assetPools: AssetPoolDocument[] = [];
    subscriptions: { [address: string]: { [i: number]: Subscription<Log> } } = {};
    providers = [
        new Web3(new Web3.providers.WebsocketProvider(TESTNET_RPC_WSS)),
        new Web3(new Web3.providers.WebsocketProvider(RPC_WSS)),
    ];

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
            this.providers[npid].eth.clearSubscriptions((error) => {
                if (!error) {
                    return logger.info('EventIndexer subscriptions cleared.', error);
                }
                throw error;
            });
        } catch (e) {
            logger.info('EventIndexer stop() failed.', e);
        }
    }

    addListener(npid: NetworkProvider, address: string) {
        try {
            this.subscriptions[address] = {};
            topics.forEach((topic: string, i: number) => {
                this.subscriptions[address][i] = this.providers[npid].eth.subscribe(
                    'logs',
                    {
                        address,
                        topics: [topic],
                    },
                    (err: any, log: any) => {
                        if (err) {
                            logger.error('EventIndexer event.callback() failed.', err);
                        }

                        try {
                            const ev = parseLog(SolutionArtifact.abi, log);
                            const args = parseArgs(ev);

                            logger.info({
                                event: ev.name,
                                args: args,
                                block: log.blockNumber,
                                hash: log.transactionHash,
                            });

                            (this as any)[`on${ev.name}`](npid, address, args);
                        } catch (e) {
                            logger.error('EventIndexer event.handle() failed.', e);
                        }
                    },
                );
            });
        } catch (e) {
            logger.error('EventIndexer addListener() failed.', e);
        }
    }

    removeListener(npid: NetworkProvider, address: string) {
        if (!address) return;
        try {
            topics.forEach((_topic: string, i: number) => {
                this.subscriptions[address][i].unsubscribe((error: any) => {
                    if (!error) {
                        return logger.info('EventIndexer subscription cleared.');
                    }
                    throw error;
                });
            });
        } catch (e) {
            logger.error('EventIndexer removeListener() failed.', e);
        }
    }

    async onWithdrawPollVoted(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id.toNumber();
            const solution = solutionContract(npid, address);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            if (args.vote === true) {
                withdrawal.poll.yesCounter += 1;
            } else if (args.vote === false) {
                withdrawal.poll.noCounter += 1;
            }

            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted += 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollVoted() failed.', e);
        }
    }

    async onWithdrawPollRevokedVote(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id.toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });
            const solution = solutionContract(npid, address);
            const vote = await callFunction(solution.methods.votesByAddress(args.member), npid);

            if (vote === true) {
                withdrawal.poll.yesCounter -= 1;
            } else if (vote === false) {
                withdrawal.poll.noCounter -= 1;
            }

            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted -= 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.', e);
        }
    }

    async onWithdrawPollCreated(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id.toNumber();
            const memberId = args.member.toNumber();
            const existingWithdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            if (existingWithdrawal) {
                return;
            }

            const solution = solutionContract(npid, address);
            const amount = Number(formatEther(await callFunction(solution.methods.getAmount(id), npid)));
            const beneficiary = await callFunction(solution.methods.getAddressByMember(memberId), npid);
            const approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            const startTime = Number(await callFunction(solution.methods.getStartTime(id), npid));
            const endTime = Number(await callFunction(solution.methods.getEndTime(id), npid));

            const withdrawal = new Withdrawal({
                id,
                amount,
                poolAddress: solution.options.address,
                beneficiary,
                approved,
                state: WithdrawalState.Pending,
                poll: {
                    startTime,
                    endTime,
                    yesCounter: 0,
                    noCounter: 0,
                    totalVoted: 0,
                },
            });

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollCreated() failed.', e);
        }
    }

    async onWithdrawn(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id.toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.', e);
        }
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id.toNumber();
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll = null;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollFinalized() failed.', e);
        }
    }
}

export const eventIndexer = new EventIndexer();
