import { Job } from 'bullmq';
import { TransactionLogEntity } from '../entities/TransactionEntity';

const dataProcessor = async (job: Job<TransactionLogEntity>) => {
    console.log('Inside processor two');
    const { logs } = job.data;
    console.log(`Log response ${logs}`);
};
export default dataProcessor;
