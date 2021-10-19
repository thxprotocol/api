import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
const bullMaster = require('bull-master');

const app = express();

const someQueue = new Queue('Queue1', { connection: new IORedis(process.env.REDIS_URI) });

async function addJobs() {
    await someQueue.add('myJobName', { foo: 'bar' });
    await someQueue.add('myJobName', { qux: 'baz' });
}
addJobs();
const bullMasterApp = bullMaster({
    queues: [someQueue],
});
// you can get existing queues
bullMasterApp.getQueues();
// you could also choose to change the queues to display in run time
bullMasterApp.setQueues([someQueue]);

app.use('/queues', bullMasterApp);

export default app;
