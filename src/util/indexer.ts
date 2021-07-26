import { logger } from './logger';
import { callFunction, NetworkProvider, solutionContract, solutionWSContract } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { formatEther } from 'ethers/lib/utils';
import { RPC_WSS, TESTNET_RPC_WSS } from './secrets';
import Web3 from 'web3';
import EventEmitter from 'events';
import { parseArgs } from './events';

const ALLOWED_EVENTS = [
    'WithdrawPollCreated',
    'WithdrawPollFinalized',
    'Withdrawn',
    'WithdrawPollVoted',
    'WithdrawPollRevokedVote',
];

class EventIndexer {
    assetPools: AssetPoolDocument[] = [];
    subscriptions: { [npid: number]: { [address: string]: EventEmitter } } = {};
    providers = [
        new Web3(new Web3.providers.WebsocketProvider(TESTNET_RPC_WSS)),
        new Web3(new Web3.providers.WebsocketProvider(RPC_WSS)),
    ];

    async start() {
        this.assetPools = await AssetPool.find({});

        for (const assetPool of this.assetPools) {
            this.addListener(assetPool.network, assetPool.address);
        }

        logger.info('EventIndexer started.');
    }

    async stop() {
        try {
            for (const pool of this.assetPools) {
                this.subscriptions[pool.network][pool.address].removeAllListeners('data');
            }
        } catch (e) {
            logger.info('EventIndexer stop() failed.', e);
        }
    }

    addListener(npid: NetworkProvider, address: string) {
        try {
            this.subscriptions[npid] = {};
            this.subscriptions[npid][address] = solutionWSContract(npid, address)
                .events.allEvents()
                .on('data', (log: any) => {
                    logger.info({
                        pool: address,
                        name: log.event,
                        returnValues: parseArgs(log.returnValues),
                        blockNumber: log.blockNumber,
                        transactionHash: log.transactionHash,
                    });

                    if (ALLOWED_EVENTS.includes(log.event)) {
                        (this as any)[`on${log.event}`](npid, address, log.returnValues);
                    }
                })
                .on('connected', (connection: any) => {
                    logger.info('EI Connect: ' + connection);
                })
                .on('changed', (change: any) => {
                    logger.error('EI Change: ' + change);
                })
                .on('error', (err: any) => {
                    logger.error('EI Error: ' + err);
                });
        } catch (e) {
            logger.error('EventIndexer addListener() failed.', e);
        }
    }

    removeListener(npid: NetworkProvider, address: string) {
        this.subscriptions[npid][address].removeAllListeners('data');
        this.subscriptions[npid][address] = null;
        delete this.subscriptions[npid][address];
    }

    async onWithdrawPollVoted(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = Number(args.id);
            const solution = solutionContract(npid, address);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll[args.vote ? 'yesCounter' : 'noCounter'] += 1;
            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted += 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollVoted() failed.', e);
        }
    }

    async onWithdrawPollRevokedVote(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = Number(args.id);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });
            const solution = solutionContract(npid, address);
            const vote = await callFunction(solution.methods.votesByAddress(args.member), npid);

            withdrawal.poll[vote ? 'yesCounter' : 'noCounter'] -= 1;
            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted -= 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.', e);
        }
    }

    async onWithdrawPollCreated(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id;
            const memberId = args.member;
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
            const id = args.id;
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.', e);
        }
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = args.id;
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll = null;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollFinalized() failed.', e);
        }
    }
}

export const eventIndexer = new EventIndexer();
