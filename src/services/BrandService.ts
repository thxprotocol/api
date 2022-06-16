import BrandModel, { IBrand, IBrandUpdate } from '@/models/Brand';

type FindOptions = Partial<Pick<IBrand, 'clientId' | 'poolAddress'>>;

export default {
    get: async (poolAddress: string) => {
        return await BrandModel.findOne({ poolAddress });
    },

    update: async (options: FindOptions, updates: IBrandUpdate) => {
        return await BrandModel.findOneAndUpdate(options, updates, { upsert: true, new: true });
    },
};
