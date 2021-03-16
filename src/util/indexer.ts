import { logger } from './logger';
import { provider, SolutionArtifact, solutionContract } from './network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { BigNumber, utils } from 'ethers/lib';
import { parseArgs, parseLog } from './events';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { formatEther } from 'ethers/lib/utils';

const events = [
    {
        topics: [utils.id('WithdrawPollCreated(uint256,uint256)')],
        callback: 'onWithdrawPollCreated',
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
                for (const event of events) {
                    provider.off({
                        address,
                        topics: event.topics,
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
            for (const event of events) {
                provider.on(
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

                            (this as any)[event.callback](address, args);
                        } catch (e) {
                            logger.error('EventIndexer event.callback() failed.');
                        }
                    },
                );
            }
        } catch (e) {
            logger.error('EventIndexer add() failed.');
        }
    }

    async onWithdrawPollVoted(address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id });

            if (args.vote === true) {
                withdrawal.poll.yesCounter += 1;
            } else if (args.vote === false) {
                withdrawal.poll.noCounter += 1;
            }

            withdrawal.poll.totalVoted += 1;

            console.log(withdrawal);

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollVoted() failed.');
        }
    }

    async onWithdrawPollRevokedVote(address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id });
            const solution = solutionContract(address);
            const vote = solution.votesByAddress(args.member);

            if (vote === true) {
                withdrawal.poll.yesCounter -= 1;
            } else if (vote === false) {
                withdrawal.poll.noCounter -= 1;
            }

            withdrawal.poll.totalVoted -= 1;

            console.log(withdrawal);

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.');
        }
    }

    async onWithdrawPollCreated(address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const solution = solutionContract(address);
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

    async onWithdrawn(address: string, args: any) {
        try {
            const id = BigNumber.from(args.id).toNumber();
            const withdrawal = await Withdrawal.findOne({ id });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.');
        }
    }
}

export const indexer = new EventIndexer();
