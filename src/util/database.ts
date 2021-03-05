import mongoose from 'mongoose';
import bluebird from 'bluebird';
import { logger } from './logger';

(mongoose as any).Promise = bluebird;

const connect = async (url: string) => {
    const mongooseOpts = {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    };

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(url, mongooseOpts);
    }

    mongoose.connection.on('error', (err) => {
        if (err) {
            logger.error(`${url}: ${err}`);
        }
        if (err.message.code === 'ETIMEDOUT') {
            mongoose.connect(url, mongooseOpts);
        }
        logger.error(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
        process.exit();
    });

    mongoose.connection.once('open', () => {
        logger.info(`MongoDB successfully connected to ${url}`);
    });
};

const truncate = async () => {
    if (mongoose.connection.readyState !== 0) {
        const { collections } = mongoose.connection;
        const promises = Object.keys(collections).map((collection) =>
            mongoose.connection.collection(collection).deleteMany({}),
        );

        await Promise.all(promises);
    }
};

const disconnect = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

export default {
    connect,
    truncate,
    disconnect,
};
