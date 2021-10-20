import { Job } from 'bullmq';

const dataProcessor = async (job: Job<JobEntity>) => {
    const { message, name } = job.data;
    console.log(`Data ${name} currently working as ${message}`);
};
export default dataProcessor;
