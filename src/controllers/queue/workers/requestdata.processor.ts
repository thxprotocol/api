import { Job } from 'bullmq';
import { solutionContract, sendTransaction } from '../../../util/network';
import { TransactionEntity } from '../entities/TransactionEntity';

const requestDataProcessor = async (job: Job<TransactionEntity>) => {
    const { poolAddress, solutionMethods, network, id, member } = job.data;
    const solution = solutionContract(network, poolAddress);
    const call = await solution.methods[solutionMethods](id, member);
    const tx = await sendTransaction(poolAddress, call, network);
    // Update database if successful, retry job if failed
    console.log(`TX Transaction log`, tx.logs);
};

export default requestDataProcessor;
