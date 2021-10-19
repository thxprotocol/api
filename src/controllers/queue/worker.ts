import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const worker = new Worker(
    'Queue1',
    async (job) => {
        job.updateProgress(42);
        worker.on('completed', (job) => {
            console.log(`${job.id} has completed!`);
        });
        worker.on('failed', (job, err) => {
            console.log(`${job.id} has failed with ${err.message}`);
        });
        job.updateProgress({ foo: 'bar' });
        return 'some value';
    },
    { connection: new IORedis(process.env.REDIS_URI) },
);
