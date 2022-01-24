import mongoose from 'mongoose';
import { NetworkProvider } from '../util/network';

export type JobDocument = mongoose.Document & {
    name: string;
    data: {
        to: string;
        args: string;
        npid: NetworkProvider;
    };
    priority: number;
    type: string;
};

const jobSchema = new mongoose.Schema(
    {
        name: String,
        data: {
            to: String,
            args: String,
            npid: Number,
        },
        priority: Number,
        type: String,
    },
    { timestamps: false },
);

export const Jobs = mongoose.model<JobDocument>('Jobs', jobSchema, 'jobs');
