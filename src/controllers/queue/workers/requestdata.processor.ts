import { Job } from 'bullmq';
import { queueProvider } from '../../../app';
import { sendTransaction } from '../../../util/network';
import { TransactionEntity } from '../entities/TransactionEntity';

const requestDataProcessor = async (job: Job<TransactionEntity>) => {
    const { address, solutionMethods, network, id, memeber } = job.data;
    console.log('Inside processor one');
    const tx = await sendTransaction(address, solutionMethods.methods.claimRewardFor(id, memeber), network);

    console.log(`Transaction log ${tx.logs}`);

    queueProvider.add({
        job: {
            logs: tx.logs,
        },
        jobName: `Transaction log process request`,
        queueName: 'data-processor',
        opts: {
            removeOnComplete: 1000,
            removeOnFail: 1000,
        },
    });
};

export default requestDataProcessor;
