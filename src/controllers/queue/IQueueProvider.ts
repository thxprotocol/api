interface addJobRequest {
    queueName: string;
    jobName: string;
    job?: object;
    opts?: {
        removeOnComplete: number;
        removeOnFail: number;
    };
}

interface registerQueueRequest {
    queueName: string;
}

interface IQueueProvider {
    register({ queueName }: registerQueueRequest): void;
    add({ queueName, job, jobName, opts }: addJobRequest): void;
    setUI(): void;
}

export { IQueueProvider, addJobRequest, registerQueueRequest };
