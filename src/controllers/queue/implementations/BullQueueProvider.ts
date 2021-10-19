import { setQueues } from 'bull-board';
import { Queue, QueueScheduler } from 'bullmq';
import { addJobRequest, IQueueProvider, registerQueueRequest } from '../IQueueProvider';
import IORedis from 'ioredis';

class BullQueueProvider implements IQueueProvider {
    private queues: Queue[];
    private queueSchedulers: QueueScheduler[];

    constructor() {
        this.queues = [];
        this.queueSchedulers = [];
    }
    setUI(): void {
        setQueues(this.queues);
    }

    register({ queueName }: registerQueueRequest): void {
        const queue = this.queues.find((q) => q.name === queueName);

        if (queue) {
            throw new Error('Queue name already registered');
        }

        this.queues.push(new Queue(queueName, { connection: new IORedis(process.env.REDIS_URI) }));
        this.queueSchedulers.push(new QueueScheduler(queueName, { connection: new IORedis(process.env.REDIS_URI) }));
    }
    add({ queueName, job, jobName, opts }: addJobRequest): void {
        const queue = this.queues.find((q) => q.name === queueName);

        if (!queue) {
            throw new Error('Queue dont exist');
        }

        queue.add(jobName, job, {
            removeOnComplete: opts?.removeOnComplete,
        });
    }
}

export { BullQueueProvider };
