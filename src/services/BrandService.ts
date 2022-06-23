import BrandModel, { TBrand, TBrandUpdate } from '@/models/Brand';

type FindOptions = Partial<Pick<TBrand, 'poolAddress'>>;

export default {
    get: async (poolAddress: string) => {
        return await BrandModel.findOne({ poolAddress });
    },

    update: async (options: FindOptions, updates: TBrandUpdate) => {
        return await BrandModel.findOneAndUpdate(options, updates, { upsert: true, new: true });
    },
};
