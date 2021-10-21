import { Job } from 'bullmq';
import { solutionContract, sendTransaction } from '../../../util/network';
import { TransactionEntity } from '../entities/TransactionEntity';
import { queueProvider } from '../../../app';

const transactionDataProcessor = async (job: Job<TransactionEntity>) => {
    const { poolAddress, solutionMethods, network, id, member } = job.data;
    const solution = solutionContract(network, poolAddress);
    const call = await solution.methods[solutionMethods](id, member);
    const tx = await sendTransaction(poolAddress, call, network);
    // Update database if successful, retry job if failed
    console.log(`TX Transaction log`, tx.logs);
    // added this to create large number of queues for testing purpose
    for (let i = 0; i < 10; i++) {
        queueProvider.add({
            job: {
                poolAddress: poolAddress,
                network: network,
                solutionMethods: 'claimRewardFor',
                id: id,
                member: member,
            },
            jobName: `sendTransaction process request`,
            queueName: 'transaction-process-requester',
            opts: {
                removeOnComplete: 1000,
                removeOnFail: 1000,
            },
        });
    }
};

export default transactionDataProcessor;
