import { Job } from 'bullmq';
import { queueProvider } from '../../../app';

const requestDataProcessor = async (job: Job) => {
    const listOfData = [{ name: 'Test name', description: 'Test desc' }];

    for (const data of listOfData) {
        console.log(`Request data ${data.name} process`);

        queueProvider.add({
            job: {
                message: data.description,
                name: data.name,
            },
            jobName: `${data.name} process request`,
            queueName: 'data-processor',
            opts: {
                removeOnComplete: 1000,
                removeOnFail: 1000,
            },
        });
    }
};

export default requestDataProcessor;
